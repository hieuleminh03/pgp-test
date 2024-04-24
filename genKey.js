const openpgp = require('openpgp');



async function generateKey() {
    const data = {
        userIDs: [{ name: 'Jon Smith', email: 'ok@test.com' }],
        passphrase: 'super long and hard to guess secret',
    };
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: data.type || 'ecc',
        curve: data.curve || 'curve25519',
        userIDs: data.userIDs,
        passphrase: data.passphrase,
        format: data.format || 'armored'
    });
    return { privateKey, publicKey, revocationCertificate };
}

generateKey().then((keys) => {
    for (const key in keys) {
        console.log(key + ':\n\n', keys[key]);
        console.log('--------------------------\n');
    }
});