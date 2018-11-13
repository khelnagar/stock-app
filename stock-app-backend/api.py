from flask import jsonify, request, Flask, Blueprint
from pymongo import MongoClient
from errors import errors
import datetime

app = Flask(__name__)

# Connect MongoFrames to the database
client = MongoClient('mongodb://db:27017/stockappdb')
db = client['stockappdb']
collection_stockdata = db['stock_data']


@app.route('/cacheget', methods=['OPTIONS'])
def get_stock_data():
	data = request.get_json()

	startdate = data.get('startdate')
	enddate = data.get('enddate')

	# This is a backend guard, although handled in front-end
	start_split = list(map(int, startdate.split('-')))
	end_split = list(map(int, enddate.split('-')))
	start_Datetime = datetime.datetime(start_split[0], start_split[1], start_split[2]).date()
	end_Datetime = datetime.datetime(end_split[0], end_split[1], end_split[2]).date()
	if start_Datetime < end_Datetime:
		raise ValueError('Start date must be more than end date.')

	obj = collection_stockdata.find_one({
		"$and": [
			{'startdate': {'$gte': startdate}}, 
			{'enddate': {'$lte': enddate}},
			{'symbol': data.get('symbol')}
		]})
	try:
		result = [
			{
				"date": i.get('date'),
				"open": i.get('open'),
				"close": i.get('close'),
			} for i in obj.get('data') 
		]
	except:
		result = []

	return jsonify({'result': result})

@app.route('/cacheset', methods=['POST'])
def create_stock_data():
	
	data = request.get_json()

	stock_data = {
		'startdate': data.get('startdate'),
		'enddate': data.get('data')[0].get('date'),
		'symbol': data.get('symbol'),
		'data': data.get('data')
	}

	collection_stockdata.insert_one(stock_data)

	return jsonify({'result': 'Added successfully.'})

stockapp = Blueprint('stockapp', __name__)

if __name__ == '__main__':
	app.register_blueprint(stockapp)
	app.register_blueprint(errors)

	app.run(debug=True, host='0.0.0.0')