module.exports = class {
    constructor(type){
        this.type = type;
    }
    request(){
        return require(`./${this.type}.js`)();
    }
};
