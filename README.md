# Stock App
Fetching stock prices within a period of time.


This project was built with: 
1. Flask web framework running Python 3.5 https://github.com/pallets/flask
3. MongoDB NoSQL database https://github.com/mongodb/mongo
2. ReactJS front-end framework https://github.com/facebook/react/

## Install Dependencies
1. Install Docker CE for Windows/Mac or Docker Toolbox


This project is fully containerized with Docker, meaning you need zero configurations on your local machine to run the app. 

## Running The App
1. CD to the root directory where docker-compose.yml exists
2. Run `docker-compose up`. It may take a little while downloading new images.
3. Go to `http://localhost:3000`. In case of having Docker Toolbox, you may be required to go to different host name - something like `http://192.168.99.100:3000/`, depending on the IP address that Docker Linux VM has.

Enjoy!