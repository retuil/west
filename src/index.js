import Card from './Card.js';
import Game from './Game.js';
import SpeedRate from './SpeedRate.js';
import TaskQueue from "./TaskQueue.js";

class Creature extends Card {
    constructor(...args) {
        super(...args);
    }

    getDescriptions() {
        const creatureDescription = getCreatureDescription(this);
        const cardDescription = super.getDescriptions();
        return [creatureDescription, ...cardDescription];
    }

    get currentPower() {
        return super.currentPower;
    }

    set currentPower(value) {
        super.currentPower = Math.min(this.currentPower + value, this.maxPower)
    }
}

class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2, image = null) {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3, image = null) {
        super(name, maxPower, image);
    }
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5, image = null) {
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation);
        });

    }

    getDescriptions() {
        const trasherDescription = 'Получает на 1 урона меньше от вражеских атак';
        return [trasherDescription, ...super.getDescriptions()];
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6, image = null) {
        super(name, maxPower, image);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        for (let oppositeCard of gameContext.oppositePlayer.table) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {


                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });

            taskQueue.continueWith(continuation);
        }
    }

    getDescriptions() {
        const gatlingDescription = 'Наносит 2 урона всем врагам на поле';
        return [gatlingDescription, ...super.getDescriptions()];
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const damageProtection = this.getInGameCount() * (this.getInGameCount() + 1) / 2;
        const additionalDamage = this.getInGameCount() * (this.getInGameCount() + 1) / 2;
        return {damageProtection, additionalDamage}
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const {damageProtection, additionalDamage} = Lad.getBonus();
        super.modifyDealedDamageToCreature(value + additionalDamage, toCard, gameContext, continuation)
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const {damageProtection, additionalDamage} = Lad.getBonus();
        super.modifyTakenDamage(Math.max(value - damageProtection, 0), fromCard, gameContext, continuation);
    }
}

class Brewer extends Duck {
    constructor() {
        super('Пивовар', 2, 'brewer.jpg');
    }
}


// Отвечает, является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает, является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Отвечает, является ли карта братком.
function isLad(card) {
    const methodNames = ['modifyDealedDamageToCreature', 'modifyTakenDamage'];
    let obj = card;
    while (obj !== null) {
        if (methodNames.every(method => typeof obj[method] === 'function')) {
            return true;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return false;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isLad(card)) {
        return 'Чем их больше, тем они сильнее';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck1 = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck1 = [
    new Trasher(),
    new Dog(),
    new Dog(),
];

const seriffStartDeck2 = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck2 = [
    new Lad(),
    new Lad(),
];

const seriffStartDeck3 = [
    new Duck(),
    new Brewer(),
];
const banditStartDeck3 = [
    new Dog(),
    new Dog(),
    new Dog(),
    new Dog(),
];

// Создание игры.
const game = new Game(seriffStartDeck3, banditStartDeck3);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(2);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
