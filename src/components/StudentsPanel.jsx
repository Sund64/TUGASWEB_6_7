import { useEffect, useState } from 'react'
import { fetchStudents } from '../api/studentApi.js'

function StudentsPanel({ client, userId }) {
  const [students, setStudents] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadStudents() {
      setStatus('loading')
      setError('')

      try {
        const data = await fetchStudents(client, userId)
        if (isActive) {
          setStudents(data)
          setStatus('success')
        }
      } catch (fetchError) {
        if (!isActive) {
          return
        }

        if (fetchError.name === 'AbortError') {
          return
        }

        setError(`Data mahasiswa gagal dimuat. ${fetchError.message}`)
        setStatus('error')
      }
    }

    loadStudents()
    return () => {
      isActive = false
    }
  }, [client, userId, retryCount])

  return (
    <section className="panel student-panel" aria-labelledby="students-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DATA OPERASIONAL</p>
          <h2 id="students-title">Data mahasiswa</h2>
        </div>
        {status === 'success' && (
          <span className="transaction-count">{students.length} mahasiswa</span>
        )}
      </div>

      {status === 'loading' && (
        <p className="form-status" role="status" aria-live="polite">
          Mengambil data mahasiswa...
        </p>
      )}

      {status === 'error' && (
        <div className="student-error" role="alert">
          <p>{error}</p>
          <button
            className="retry-button"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {status === 'success' && students.length === 0 && (
        <p className="empty-state">Belum ada data mahasiswa</p>
      )}

      {status === 'success' && students.length > 0 && (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th scope="col">NIM</th>
                <th scope="col">Nama</th>
                <th scope="col">Program studi</th>
                <th scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.nim}</td>
                  <td>{student.name}</td>
                  <td>{student.program || '—'}</td>
                  <td>{student.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default StudentsPanel
