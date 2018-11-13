from flask import Blueprint, jsonify


# Create a blueprint object to be registered in run.py
errors = Blueprint('errors', __name__)


# Resource not found
@errors.app_errorhandler(404)
def error_404(error):
	return jsonify({"status": "failed", "message": "not found"}), 404

# Internal server error
@errors.app_errorhandler(500)
def error_500(error):
	return jsonify({}), 500

# Bad request,e.g, invalid content-type
@errors.app_errorhandler(400)
def error_400(error):
	return jsonify({"status": "failed", "message": "Bad Request"}), 400
	