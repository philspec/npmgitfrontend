1. i am building an app that lists a list of npm packages with their details and a github star history graph.
2. it uses npms api to get a list of npm packages with their details and a githubstarhistory api to get the svg of the stars vs date 
3. i already have a reactJS vite app with tailwind css installed.
4.  my app src file structure is
src
└── assets
    ├── react.svg
└── App.css
└── App.jsx
└── index.css
└── main.jsx

5. you can refer to attached notepads for api structures.
6. Functionalities and Design:

    1. the header section must contain the title npmgit. 
    2. the search bar must contain a search box and a button to search for npm packages.
    3. below the search bar give qualifiers to include in the search. also mention they are optional and to be given before search. give relevant input fields for all the listed qualifiers in the api docs.
    4. the strucutere of reuest must be like "https://api.npms.io/v2/search?q=react+qualifier1:values+qulaifier2:values+keywords:word1,word2,wrod3&size=5"
    5. store the details of the packages in a state variable. the state must be an array of objects.
    6. after that create an array with the names of the packages use that in the body of this api  to get thier full details
    "curl -X POST "https://api.npms.io/v2/package/mget" \
	    -H "Accept: application/json" \
	    -H "Content-Type: application/json" \
	    -d '["cross-spawn", "react"]'"
        convert this to a http request and append the deatils f the specifc packa to thoes objects in the array previously fetched
    7. for each package get the svg for githubstar historty using this api 
    request: api.star-history.com/svg?repos=reduxjs/react-redux&type=Date
    8. when the reuslts are got, make a list with each item as a card.
    as soon as the list is got, there must display a second set of filters for sorting the results. it must contain scores titles and a dropdown for each of the scores, github stars the dropdown must have options for quality, popularity and maintenance. when a score is selected, the list must be sorted based on that score.

    8. Card design is 
        1. title: package name
        2. description: package description
        3. links for npm , repository (name it as github) , homepage
        4. scores (final , quality, poplularity, maiintainnce ) given as circles with rounded ro single decimal values in center and a circle perimeter with color highlight covering the score% of perimeter from the center in clockwise. give the color to that circle based on the score. covering red to green spectrum for 0 to 100 respectively.
        5. above elemts must be to the left of card and in a col
        6. stars graph is to be fetched for each of the packages in the list. so after fetching the list of packages, fetch the stars graph for each package and display it in a card to the right. right to the above elemts div. this githubstarthistory api must be constructed carefully from the package name as given in the api docs. 

