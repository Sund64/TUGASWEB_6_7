export async function fetchStudents(client, userId) {
  const { data, error } = await client
    .from('students')
    .select('id, nim, name, program, email')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
