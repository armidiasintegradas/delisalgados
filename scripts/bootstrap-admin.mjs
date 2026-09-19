import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DELI_BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.DELI_BOOTSTRAP_ADMIN_PASSWORD;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing DELI_BOOTSTRAP_ADMIN_EMAIL or DELI_BOOTSTRAP_ADMIN_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const normalizedEmail = email.trim().toLowerCase();

const { data: existingList, error: listError } =
  await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

if (listError) {
  console.error("Unable to list auth users:", listError.message);
  process.exit(1);
}

let user = existingList.users.find(
  (candidate) => candidate.email?.toLowerCase() === normalizedEmail
);

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name: "Deli Gestão" },
    app_metadata: { role: "administrator" },
  });

  if (error || !data.user) {
    console.error("Unable to create admin user:", error?.message || "unknown error");
    process.exit(1);
  }
  user = data.user;
}

const { error: profileError } = await supabase
  .from("admin_profiles")
  .upsert(
    {
      id: user.id,
      email: normalizedEmail,
      name: "Deli Gestão",
      role: "administrator",
      is_active: true,
    },
    { onConflict: "id" }
  );

if (profileError) {
  console.error("Unable to create admin profile:", profileError.message);
  process.exit(1);
}

console.log(`Admin bootstrap complete for ${normalizedEmail} (user id: ${user.id}).`);
