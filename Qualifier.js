let winston = require("winston");

/** Calculates a score that represents the utility/usefulness of its associated action. */
function Qualifier(scorers, action) {
	this.scorers = scorers;
	this.action = action;
}

//set up the base score function
Qualifier.prototype.score = function(context) {
	return Promise.reject("Default Qualifier Used");
}

/**
  Returns the sum of all Scorers if all the scores are above the threshold
*/
function AllOrNothingQualifier(scorers, action, threshold) {
	this.threshold = threshold;
	Qualifier.call(this, scorers, action);
}
AllOrNothingQualifier.prototype = Object.create(Qualifier.prototype);
AllOrNothingQualifier.prototype.score = function(context) {
	//loop through the scorers and sum them up
	var scorerPromises = this.scorers.map(scorer => {
		return scorer.score(context);
	});
	return Promise.all(scorerPromises)
	    .then(values => {
	    	var sum = values.reduce(function(acc, val) {
  					return acc + val;
				}, 0);
	    	winston.debug("AllOrNothingQualifier::score - sum is " + sum + ", threshold is " + this.threshold);
	    	return Promise.resolve(sum > this.threshold ? sum : 0);
	    })
	    .catch(error => { return Promise.reject(error); } );
}

/**
  Returns a fixed score
*/
function FixedQualifier(scorers, action, value) {
	this.value = value;
	Qualifier.call(this, scorers, action);
}
FixedQualifier.prototype = Object.create(Qualifier.prototype);
FixedQualifier.prototype.score = function(context) {
	return Promise.resolve(this.value);
}

/**
  Returns the sum of all Scorers
*/
function SumOfChildrenQualifier(scorers, action) {
	Qualifier.call(this, scorers, action);
}
SumOfChildrenQualifier.prototype = Object.create(Qualifier.prototype);
SumOfChildrenQualifier.prototype.score = function(context) {
	//loop through the scorers and sum them up
	var scorerPromises = this.scorers.map(scorer => {
		return scorer.score(context);
	});
	return Promise.all(scorerPromises)
	    .then(values => {
	    	var sum = values.reduce(function(acc, val) {
  					return acc + val;
				}, 0);
	    	return Promise.resolve(sum);
	    })
	    .catch(error => { return Promise.reject(error); } );
}

module.exports = {
  Qualifier,
  AllOrNothingQualifier,
  FixedQualifier,
  SumOfChildrenQualifier
};