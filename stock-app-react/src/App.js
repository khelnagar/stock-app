import React, { Component } from 'react';
import DatePicker from "react-datepicker";
import moment from "moment";
import Table from './components/table'; 
import Loader from './components/loader'; 

import "react-datepicker/dist/react-datepicker.css";
import './App.css';



class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      instances: [],
      inputs: {
        startDate: moment(),
        endDate: moment(),
        symbol: ''
      },
      loading: null,
      submitted: false,
      error: null,
      errorMsg: ''
    }
    
    this.render = this.render.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.addToCache = this.addToCache.bind(this);
    this.generateLink = this.generateLink.bind(this);
    this.validateDateRange = this.validateDateRange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.getMonthlyAverage = this.getMonthlyAverage.bind(this);
  }
  
  static getInputValue(event){
    let value;
    if (event.constructor.name === 'Moment' || event._isAMomentObject){
      value = event;
    } else
    {
      value = event.target.value;
    }
    return value;
  }

  validateDateRange() {
    // make sure startDate > endDate
    return this.state.inputs.startDate.diff(this.state.inputs.endDate, 'days') >= 0
  }
  
  generateLink(inputs) {
    // startDate > endDate
    let startDate = moment().format("YYYY-MM-DD");
    let endDate = inputs.endDate.format("YYYY-MM-DD");
    let diffMonths = moment(startDate).diff(moment(endDate), 'months', true);

    let request = null;
    if (diffMonths === 0) {
      request = '1m';
    } else if (diffMonths > 60) {
      // this is an API constraint 
      alert('Only 5 years span is allowed.');
      return;
    } else {
      const query = [
        {months: 1, request: '1m'},
        {months: 3, request: '3m'},
        {months: 6, request: '6m'},
        {months: 12, request: '1y'},
        {months: 24, request: '2y'},
        {months: 60, request: '5y'}
      ]
      
      let i = 0;
      while (i < query.length) {
        if (diffMonths > query[i].months) {
          i++;
        } else {
          request = query[i].request;
          break;
        }
      }
    }

    const symbol = inputs.symbol;
    let link = `https://api.iextrading.com/1.0/stock/${symbol}/chart/${request}`;
    
    return link;
  }

  getMonthlyAverage(data) {
  	const startDate = this.state.inputs.startDate.format("YYYY-MM-DD");
  	const endDate = this.state.inputs.endDate.format("YYYY-MM-DD");
  	
    let months = {};
  	for (let i of data) {
      // this condition is to reduce the API fetched data, only the range of period dates specified 
  		if (moment(i.date).diff(moment(endDate), 'days') >= 0 && moment(startDate).diff(moment(i.date), 'days') >= 0) {
  			const month = i.date.split('-').slice(0, 2).join('-');
  			if (month in months) {
  				months[month]['open'] += i.open;
  				months[month]['close'] += i.close;
  				months[month]['days'] += 1;
  			} else {
  				months[month] = {
  					'open': i.open,
  					'close': i.close,
  					'days': 1 	
  				};
  			}
  		}
  	}

  	return months;
  }

  handleInputChange(event, name) {
    let value = App.getInputValue(event);
    this.setState( prevState => {
      prevState.inputs[name] = value;
      prevState.submitted = false;
      prevState.error = false;
      prevState.loading = false;
      return prevState;
    });
  }

  addToCache(data) {
    fetch('/cacheset', {
        method: "POST",
        body: JSON.stringify({
          data: data,
          startdate: this.state.inputs.startDate.format("YYYY-MM-DD"),
          symbol: this.state.inputs.symbol.toLowerCase()
        }),
        headers: {
          "Content-Type": "application/json"
        },
      }).then((response) => {
        if(response.ok){
          var contentType = response.headers.get("content-type");
          if(contentType && contentType.includes("application/json"))
            return response.json();
        } else {
          throw new Error('Something is wrong to the backend API service. Check!');
        }
      }).then((json) => {
          console.log(json.result);
      }).catch((error) => {
          console.log(error.message);
      });
  }

  fetchData(link) {
    if (!this.validateDateRange()) {
      alert('Start date must be more than end date.');
      return;
    }

    this.setState({loading: true, submitted: false, instances: [], error: false});
    // go try fetch data from from DB first
    fetch('/cacheget', {
        method: "OPTIONS",
        body: JSON.stringify({
          startdate: this.state.inputs.startDate.format('YYYY-MM-DD'),
          enddate: this.state.inputs.endDate.format('YYYY-MM-DD'),
          symbol: this.state.inputs.symbol.toLowerCase(),
        }),
        headers: {
          "Content-Type": "application/json"
        },
      }).then((response) => {
        if(response.ok){
          var contentType = response.headers.get("content-type");
          if(contentType && contentType.includes("application/json"))
            return response.json();
        } else {
          throw new Error('Reaching out to the API');
        }
      }).then((json) => {
          if (json.result.length > 0) {
            this.setState({instances: json.result, loading: false, submitted: true, error: false});
          } else {
            throw new Error('Reaching out to the API');
          }
      }).catch((error) => {
          // fetch data from the API
          fetch(link, {
            method: "GET",
          }).then((response) => {
            if(response.ok){
              var contentType = response.headers.get("content-type");
              if(contentType && contentType.includes("application/json"))
                return response.json();
            } else if (response.status === 404){
              throw new Error('Resource not found. Check correct symbol.');
            } else if (response.status === 403) {
              throw new Error('Bad request/Forbidden');
            } else {
              throw new Error('Something went wrong!');
            }
          }).then((json) => {
              // add new data to the db cache, if any
              if (json.length > 0) {
                this.addToCache(json);
              } 
              // update user interface and display data
            	this.setState({instances: json, loading: false, submitted: true, error: false});
          }).catch((error) => {
            this.setState({error: true, loading: false, submitted: false, errorMsg: error.message, instances: []})
          });
      });
  }

  render() {

    const link = this.generateLink(this.state.inputs);

    let months = {}
    if (this.state.submitted) {
    	months = this.getMonthlyAverage(this.state.instances);
    }

    return (
      <div className="App">
      	<hr className="line" />

      	<div className='header'>
          <h1>Stock App</h1>
          <p>Getting stock prices within a period.</p>
        </div>

    		<div className="w3-content formContainer">
    			<div className="w3-third">
    				<p>Start Date</p>
    			    <DatePicker
    			    	className="formInput"
    			        selected={this.state.inputs.startDate}
    			        selectsStart
    			        startDate={this.state.inputs.startDate}
    			        endDate={this.state.inputs.endDate}
    			        maxDate={moment()}
    			        onChange={(event) => this.handleInputChange(event, 'startDate')}
    			    />
            <p style={{fontSize: '11px'}}>Start date must be more than end date.</p>
    			</div>
    			<div className="w3-third">
    				<p>End Date</p>
    			    <DatePicker
    			    	className="formInput"
    			        selected={this.state.inputs.endDate}
    			        selectsEnd
    			        startDate={this.state.startDate}
    			        endDate={this.state.inputs.endDate}
                  maxDate={moment()}
    			        onChange={(event) => this.handleInputChange(event, 'endDate')}
    			    />
    			</div>
    			<div className="w3-third">
    					<p>Symbol</p>
    				<input className="formInput" type='text' value={this.state.inputs.symbol} onChange={(event) => this.handleInputChange(event, 'symbol')}/>
    			</div>
    		</div>

    		<div className="w3-row">
    			<button className='w3-btn w3-indigo sButton' onClick={() => this.fetchData(link)}>Get Data</button>
    		</div>

    		{this.state.loading && 
          <Loader />
        }
    		
        {this.state.error && 
          <p>{this.state.errorMsg}</p>
        }
    		
        {this.state.submitted && 
          <Table 
    			 title={'Monthly Average Open/Close Stock Prices - ' + this.state.inputs.symbol.toUpperCase()} 
    			 data={months}
    		  />
        }
      </div>
    );
  }
}

export default App;
