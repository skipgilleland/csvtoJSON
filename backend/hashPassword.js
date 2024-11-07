const bcryptjs = require('bcryptjs');

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcryptjs.hash(password, saltRounds);
}

hashPassword('newPassword123').then(hashedPassword => {
    console.log('Hashed Password:', hashedPassword);
});

