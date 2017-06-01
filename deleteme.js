var createObject = function(constructorValues){
    var myObject = {
        myProperty: 'initial value',

        getProperty: function(){
            return this.myProperty;
        },

        setProperty: function(newValue){
            this.myProperty = newValue;
        }


    };

    return myObject;
};



var firstObject = createObject();
var secondObject = createObject();

var thirdObject = {
    myProperty: 'initial value',

    getProperty: function(){
        return this.myProperty;
    },

    setProperty: function(newValue){
        this.myProperty = newValue;
    }
};

thirdObject.setProperty("new value");
thirdObject.getProperty();

firstObject.setProperty("new value");
firstObject.getProperty();

thirdObject.anotherProperty = "another property";

thirdObject.setAnotherProperty = function(newValue){
    this.anotherProperty = newValue;
};

thirdObject.getAnotherProperty = function(){
    return this.anotherProperty;
};

console.log(thirdObject.getProperty());
console.log(thirdObject.getAnotherProperty());


console.log("First object property value:   " + firstObject.getProperty());
console.log("Second object property value:  " + secondObject.getProperty());

console.log("Setting new value for first object");
firstObject.setProperty("new value");

console.log("First object property value:   " + firstObject.getProperty());
console.log("Second object property value:  " + secondObject.getProperty());
