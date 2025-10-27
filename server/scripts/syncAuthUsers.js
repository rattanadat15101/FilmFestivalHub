// /server/scripts/syncAuthUsers.js
import { supabase } from '../utils/supabaseServer.js';
import 'dotenv/config';

/*
 * =================================================================
 * (ONE-TIME SCRIPT) - Sync Users from auth.users to profiles
 * =================================================================
 * สคริปต์นี้มีไว้สำหรับย้ายข้อมูล User เก่าจาก Supabase Auth
 * มายังตาราง profiles เพื่อใช้กับระบบ JWT ใหม่
 * - มันจะดึง email และ id จาก auth.users
 * - มันจะดึง email ทั้งหมดจาก profiles มาเทียบ
 * - มันจะ insert เฉพาะ user ที่ยังไม่มี email ใน profiles
 * - User ที่ถูกย้ายมา จะยังไม่มีรหัสผ่าน (password_hash = null)
 * และจะต้องใช้ระบบ "Reset Password" เพื่อตั้งรหัสผ่านใหม่
 * =================================================================
 */
async function syncUsers() {
  console.log('Starting user sync...');

  try {
    // 1. ดึง User ทั้งหมดจาก Supabase Auth (ต้องใช้ Service Key)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw new Error(`Failed to list auth users: ${authError.message}`);
    const authUsers = authData.users;
    console.log(`Found ${authUsers.length} users in auth.users.`);

    // 2. ดึง Email ทั้งหมดที่มีในตาราง profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email');
    if (profileError) throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    
    const existingProfileEmails = new Set(profiles.map(p => p.email));
    console.log(`Found ${existingProfileEmails.size} existing emails in profiles.`);

    // 3. กรองหา User ที่ต้อง Sync (คนที่ยังไม่มี email ใน profiles)
    const usersToSync = authUsers.filter(authUser => 
      !existingProfileEmails.has(authUser.email)
    );

    if (usersToSync.length === 0) {
      console.log('✅ All users are already in sync. No action needed.');
      return;
    }

    console.log(`Found ${usersToSync.length} new users to sync...`);

    // 4. เตรียมข้อมูลสำหรับ Insert
    // เราจะใช้ id, email, created_at เดิมจาก auth.users
    const newProfilesData = usersToSync.map(user => {
      // สร้าง username ชั่วคราวจาก email (เช่น "example@gmail.com" -> "example")
      const username = user.email.split('@')[0];
      return {
        id: user.id, // ใช้ UUID เดิมจาก auth.users
        email: user.email,
        username: username,
        created_at: user.created_at,
        // password_hash จะเป็น null โดย default
      };
    });

    // 5. Insert ข้อมูลใหม่ลง profiles
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfilesData);

    if (insertError) {
      throw new Error(`Failed to insert new profiles: ${insertError.message}`);
    }

    console.log(`✅ Successfully synced ${usersToSync.length} users!`);
    console.log('Users who were synced must now use the "Forgot Password" feature to set their password.');

  } catch (err) {
    console.error('❌ Error during user sync:', err.message);
  }
}

// สั่งให้สคริปต์ทำงาน
syncUsers();