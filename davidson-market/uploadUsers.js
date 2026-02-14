// Step 1: Import Supabase and fs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Step 2: Supabase project details
const supabaseUrl = 'https://uiugyoptekdlcsrkhxxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdWd5b3B0ZWtkbGNzcmtoeHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODA1MzYsImV4cCI6MjA4NTU1NjUzNn0.OTsuzFM55Aw3ojq2G_6QTU4yZKNCt6UVWvj_uH6X5WM'; // replace this with your service key
const supabase = createClient(supabaseUrl, supabaseKey);

// Step 3: Read your JSON file
const rawData = fs.readFileSync('all_data.json', 'utf-8'); // make sure all_data.json is in the same folder
const users = JSON.parse(rawData);

// Step 4: Function to upload users
async function uploadUsers() {
  const { data, error } = await supabase
    .from('directory_lookup') // replace with your table name
    .insert(users);

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Data uploaded successfully:', data);
  }
}

// Step 5: Run the function
uploadUsers();
