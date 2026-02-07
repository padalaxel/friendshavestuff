
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqleqqnfnbxzuxqquqgj.supabase.co';
const supabaseKey = 'sb_publishable_9hpX868N15zQbIDph3IGAg_riZqmrqi'; // Anon Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing Comments Fetch...');

    // 1. Fetch all comments
    const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*');

    if (commentsError) {
        console.error('Error fetching comments:', commentsError);
    } else {
        console.log(`Found ${comments.length} comments.`);
        console.log(JSON.stringify(comments, null, 2));

        if (comments.length > 0) {
            if ('parent_id' in comments[0]) {
                console.log('✅ parent_id column exists.');
            } else {
                console.log('❌ parent_id column MISSING in result (might be null or not selected).');
            }
        } else {
            console.log('No comments found to check structure.');
        }
    }

    // 3. Check Users
    console.log('Testing Users Fetch...');
    const { data: users, error: usersError } = await supabase
        .from('allowed_users')
        .select('*');

    if (usersError) {
        console.log('Error fetching users:', usersError);
    } else {
        console.log(`Found ${users.length} allowed users.`);
        // console.log(JSON.stringify(users, null, 2));
    }
}

testFetch();
