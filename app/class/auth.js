const Database = require('./database');
const User = require('./user');
const jwt = require('jsonwebtoken');

class Auth {

    static async login (username, password) {
        const user = await User.getByUsername(username);

        if (!user) {
            return reply.status(400).send({ error: 'Username or password incorrect' });
        }

        /*if (!await this.checkPassword(user, password)) {
            return reply.status(400).send({ error: 'Username or password incorrect' });
        }*/

        const token = await this.#generateToken(user);
        return token
    }

    //auth check password
    async checkPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    //auth generate token
    static async #generateToken(user) {

        user.token = await jwt.sign({ id: user.id }, "epsitec", { expiresIn: '1h' });
        await user.persist();

        return user.token;
    }
}

module.exports = Auth;