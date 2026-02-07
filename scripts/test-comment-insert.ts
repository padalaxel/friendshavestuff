
import { createClient } from '@supabase/supabase-js';

// Hardcoded for testing - using Anon key (client side simulation)
const supabaseUrl = 'https://lqleqqnfnbxzuxqquqgj.supabase.co';
const supabaseKey = 'sb_publishable_9hpX868N15zQbIDph3IGAg_riZqmrqi';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('--- Testing Comment Insertion ---');

    // 1. Pick a valid User and Item (from previous test run or hardcoded if known)
    // I'll try to find one first.

    const { data: items } = await supabase.from('items').select('id, name').limit(1);
    if (!items || items.length === 0) {
        console.error("No items found to comment on.");
        return;
    }
    const itemId = items[0].id;
    console.log(`Target Item: ${items[0].name} (${itemId})`);

    // We need a valid user ID. The anon client can only insert if it's authenticated (via RLS) 
    // OR if we opened it up to everyone (which we tried).
    // BUT the policy I gave "TO authenticated" might block anon client without session.
    // Let's try to sign in first? Or just try insertion if I opened it to public?
    // The user's previous SQL was: "TO authenticated". So I MUST be signed in.

    // Actually, let's try to fetch comments first to ensure we can READ.
    const { data: comments, error: readError } = await supabase
        .from('comments')
        .select('*')
        .limit(1);

    if (readError) {
        console.error("READ Error:", readError);
    } else {
        console.log("READ Success. Count:", comments.length);
    }

    // INSERT TEST
    // Since we don't have a user token here easily, we can't really test "Authenticated" policy from this script 
    // without a valid login credentials (email/pass).

    // So instead, I will ask the user to temporarily allow PUBLIC inserts to rule out auth entirely.
    // OR I can use the SERVICE_ROLE key if I can find it... but good practice says I shouldn't have it.

    // Wait, I can create a new policy that allows public insert for a specific test user ID if I want?
    // No, let's stick to diagnosing the environment.

    // Let's print the RLS policies if possible?
    const { data: policies, error: policyError } = await supabase
        .from('pg_policies') // This is usually not accessible to anon
        .select('*');

    if (policyError) {
        console.log("Cannot list policies (expected):", policyError.message);
    }
}

testInsert();
