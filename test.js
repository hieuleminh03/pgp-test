const openpgp = require('openpgp');

// sinh ra key
async function genKey() {
    const data = {
        userIDs: [{ name: 'Jon Smith', email: 'ok@test.com' }],
        passphrase: '12345',
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

async function genKey2() {
    const data = {
        userIDs: [{ name: 'Minh Hieu', email: 'ok@test.com' }],
        passphrase: 'code la bug',
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

// mã hóa message theo dạng binary\
// không dùng
async function encryptMessage() {
    const message = await openpgp.createMessage({ binary: new Uint8Array([0x01, 0x01, 0x01]) });
    const encrypted = await openpgp.encrypt({
        message, // input as Message object
        passwords: ['secret stuff'], // multiple passwords possible
        format: 'binary' // don't ASCII armor (for Uint8Array output)
    });
    console.log(encrypted); // Uint8Array

    const encryptedMessage = await openpgp.readMessage({
        binaryMessage: encrypted // parse encrypted bytes
    });
    const { data: decrypted } = await openpgp.decrypt({
        message: encryptedMessage,
        passwords: ['secret stuff'], // decrypt with password
        format: 'binary' // output as Uint8Array
    });
    console.log(decrypted); // Uint8Array([0x01, 0x01, 0x01])
}

// mã hóa message theo dạng text
// sử dụng 2 cặp key của A và B
async function encryptMessageAToB() {
    const { privateKey: privateKeyArmoredA, publicKey: publicKeyArmoredA } = await genKey();
    const { privateKey: privateKeyArmoredB, publicKey: publicKeyArmoredB } = await genKey2();

    const passphraseA = `12345`; // what the private key is encrypted with
    const passphraseB = `code la bug`; // what the private key is encrypted with

    const publicKeyA = await openpgp.readKey({ armoredKey: publicKeyArmoredA });
    const publicKeyB = await openpgp.readKey({ armoredKey: publicKeyArmoredB });

    const privateKeyA = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmoredA }),
        passphrase: passphraseA
    });
    const privateKeyB = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmoredB }),
        passphrase: passphraseB
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: 'code la bug' }), // input as Message object
        encryptionKeys: publicKeyB,
        signingKeys: privateKeyA // optional
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    const message = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: publicKeyA, // optional
        decryptionKeys: privateKeyB
    });
    console.log("tin nhắn: ", decrypted); 
    console.log(); 
    // check signature validity (signed messages only)
    try {
        await signatures[0].verified; // throws on invalid signature
        console.log('B check đúng chữ ký của A');
    } catch (e) {
        throw new Error('B không check đc chữ ký: ' + e.message);
    }
}

// A encrypt mail của nó
async function ASaveMail() {
    const { privateKey: privateKeyArmoredA, publicKey: publicKeyArmoredA } = await genKey();
    const passphraseA = `12345`; 
    const publicKeyA = await openpgp.readKey({ armoredKey: publicKeyArmoredA });

    const privateKeyA = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmoredA }),
        passphrase: passphraseA
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: 'code la bug' }), // input as Message object
        encryptionKeys: publicKeyA,
        signingKeys: privateKeyA // để A check chữ ký của nó
    });
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    const message = await openpgp.readMessage({
        armoredMessage: encrypted // parse armored message
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: publicKeyA, // optional
        decryptionKeys: privateKeyA
    });
    console.log("tin nhắn: ", decrypted);
    console.log();
    // check signature validity (signed messages only)
    try {
        await signatures[0].verified; // throws on invalid signature
        console.log('A check đúng chữ ký của A');
    } catch (e) {
        throw new Error('A không check đc chữ ký: ' + e.message);
    }
}

ASaveMail();