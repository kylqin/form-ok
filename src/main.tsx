import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './views/App'
import { createField } from './core/types'
import './core/fields'

const field = createField({})
console.log(field)

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
