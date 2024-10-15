import { useState } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [size, setSize] = useState(10)
  const [ranking, setRanking] = useState('optimal')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInput = (e) => {
    setInput(e.target.value)
  }
  
  const handleSearch = async () => {
    setLoading(true)
    const response = await fetch(`https://registry.npmjs.com/-/v1/search?text=${input}&size=${size}&page=2`)
    const data = await response.json()
    setResponse(data)
    setLoading(false)
  }

  const handleSize = (e) => {
    setSize(e.target.value)
  } 

  const handleRanking = (e) => {
    setRanking(e.target.value)
  } 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <input type="text" value={input} onChange={handleInput} placeholder="Search NPM packages" />
      <select value={ranking} onChange={handleRanking}>
        <option value="optimal">Optimal</option>
        <option value="popularity">Popularity</option>
        <option value="quality">Quality</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <input type="number" value={size} onChange={handleSize} placeholder="Number of results" />
      <button onClick={handleSearch}>Search</button>
      {loading && <p>Loading...</p>}
      {!loading && response && <p>Response: {JSON.stringify(response)}</p>}
    </div>
  )
}

export default App
