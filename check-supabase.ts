import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.storage.getBucket('visitor-uploads');
    console.log("Bucket check:", data ? 'Exists' : 'Does not exist', error);

    const filename = 'f989d043-bbbd-4989-8172-062fa95f5199.jpg';
    console.log("Downloading", filename);
    const { data: fileData, error: fileError } = await supabase.storage.from('visitor-uploads').download(filename);
    console.log("Download check:", fileData ? `Success, size: ${fileData.size}` : 'Failed', fileError);
}

main().catch(console.error);
