import React, { Component } from 'react';


export default class Table extends Component {
  render () {
    const rows = Object.keys(this.props.data).map((key, i) => (
            <tr key={i}>
              <td>{key}</td>
              <td>{this.props.data[key].days}</td>
              <td>{(this.props.data[key].open/this.props.data[key].days).toFixed(3)}</td>
              <td>{(this.props.data[key].close/this.props.data[key].days).toFixed(3)}</td>
            </tr>
    ))
    
    return (
        <div className="w3-content" style={{width: '50%', marginTop: '50px', marginBottom: '50px'}}>
          <h3>{this.props.title}</h3>

          <table className="w3-table-all">
            <thead>
              <tr className="w3-blue">
                <th>Month</th>
                <th>Days Fetched</th>
                <th>Opening Price</th>
                <th>Closing Price</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
    )
  }
}