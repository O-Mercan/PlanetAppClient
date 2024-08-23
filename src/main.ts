import { 
    Connection, 
    Keypair, 
    LAMPORTS_PER_SOL, 
    PublicKey, SystemProgram,  
    TransactionInstruction, 
    TransactionMessage, 
    VersionedTransaction 
} from "@solana/web3.js"

import * as borsh from 'borsh';

const privateKeyPairArray = [33,45,176,74,4,228,251,63,40,123,51,86,101,100,103,28,86,140,134,0,23,163,212,222,129,205,78,81,9,162,132,102,218,97,125,142,67,231,94,246,35,81,52,56,254,199,42,1,246,163,224,110,26,175,130,183,131,47,111,102,106,227,116,182]
const payer = Keypair.fromSecretKey(Uint8Array.from(privateKeyPairArray))


const connection = new Connection("https://api.testnet.solana.com", "confirmed")

const programId = new PublicKey("9oFdyv5nQui8agqyAsVe8sreji8uHK3CnYhKqHwDbM1G");

const explorerDefault = {
    name: '', 
    surname: '', 
    age: 0,  
    planet_amount: 0,
    explorer_account: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
};

const explorerSchema = { 
    struct: { 
        name: 'string', 
        surname: 'string' , 
        age: "u8", 
        planet_amount : "u8",
        explorer_account: { array: { type: 'u8', len: 32 }}
    }
    
};


const createNewExplorerAccount = async (name: string, surname: string, age: number) => {

    const newExplorerKeyPair = Keypair.generate()
    console.log("New Explorer's public key:", newExplorerKeyPair.publicKey.toString())

    explorerDefault.name = name;
    explorerDefault.surname= surname;
    explorerDefault.age = age;
    explorerDefault.planet_amount = 0;

    console.log('Explorer name: ', explorerDefault.name)
    console.log('Explorer surname: ', explorerDefault.surname)
    console.log('Explorer age: ', explorerDefault.age)
    console.log('Explorer amount of planet :', explorerDefault.planet_amount)


    let encoded = borsh.serialize(explorerSchema, explorerDefault);
    console.log(encoded.byteLength)
    const concated = Uint8Array.of(0, ...encoded) 


    // First Instruction: create account
    const createNewExplorerAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: newExplorerKeyPair.publicKey,
        lamports: LAMPORTS_PER_SOL * 0.1,  // Yeni hesaba gönderilecek miktar
        space: encoded.byteLength,  // Hesabın tutacağı veri miktarı (byte cinsinden)
        programId: programId //Hangi programa ait olacağı
    })
    console.log("New Explorer's public key:", newExplorerKeyPair.publicKey.toString())


    const instructionData = Buffer.from(concated);

    // Invoke program
    const ix = new TransactionInstruction({
        programId: programId, //transactionIx içindeki id hangi programı çağırıyor, Şu adrese gidecek
        keys: [
            { pubkey: newExplorerKeyPair.publicKey, isSigner: false, isWritable: true },
            { pubkey: payer.publicKey, isSigner: false, isWritable: true }
        ],//  çağırdığımız programa gönderdiğmiz Ix e gönderdiğimiz account lar
        data: instructionData // çağırdığımız programa gönderdiğimiz data
    });


    // Transactiona son block hash'ini ekleyip iki instruction ekliyoruz
    const blockHash = await connection.getLatestBlockhash()
    const message = new TransactionMessage({
        instructions: [createNewExplorerAccountIx, ix],
        payerKey: payer.publicKey, //fee ödeyen (gönderme ücreti)
        recentBlockhash: blockHash.blockhash
    }).compileToV0Message()



    const tx = new VersionedTransaction(message)
    tx.sign([payer, newExplorerKeyPair])

    // İşlemi gönderme ve imzayı konsola yazdırma
    const signature = await connection.sendTransaction(tx)
    console.log("İşlem İmzası:", signature)
    
}

const readExplorerAccount = async () => {

    const readAccountKey = new PublicKey("DKBk6Dqnt8eW5WeAQaxfR7tp7CVhCgdAvwM5bEj2Z4Z3")
    const accountInfo = await connection.getAccountInfo(readAccountKey);

    const data =  borsh.deserialize( explorerSchema,accountInfo?.data!)
    console.log(data)
}

const planetDefault = {
    name: '', 
    planet_age: 0, 
    explorer_account: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  
    is_confirmed: 0,
};

const planetSchema = { 
    struct: { 
        name: 'string', 
        planet_age: "u8", 
        explorer_account: { array: { type: 'u8', len: 32 }},
        is_confirmed:  "u8",    }
};
const createPlanet = async () => {

    const planetKeyPair = Keypair.generate()
    console.log("Planet's public key:", planetKeyPair.publicKey.toString())
    const explorerPublicKey = new PublicKey("DKBk6Dqnt8eW5WeAQaxfR7tp7CVhCgdAvwM5bEj2Z4Z3")

    planetDefault.name = "Sirius";
    planetDefault.planet_age= 12345;
    
    

    console.log('Planet name: ', planetDefault.name)
    console.log('Planet age: ', planetDefault.planet_age)
    
    let encoded = borsh.serialize(planetSchema, planetDefault);
    const concated = Uint8Array.of(1, ...encoded) 

       // First Instruction: create account
       const createNewPlanetAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: planetKeyPair.publicKey,
        lamports: LAMPORTS_PER_SOL * 0.1,  // Yeni hesaba gönderilecek miktar
        space: encoded.byteLength,  // Hesabın tutacağı veri miktarı (byte cinsinden)
        programId: programId //Hangi programa ait olacağı
    })
    console.log("New Planet's public key:", planetKeyPair.publicKey.toString())



    // invoke program
    const ix = new TransactionInstruction({
        programId: programId,
        keys: [
            { pubkey: planetKeyPair.publicKey, isSigner: false, isWritable: true},
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: explorerPublicKey, isSigner: false, isWritable: true },  
        ],
        data: Buffer.from(concated)
    });


    // Transactiona son block hash'ini ekleyip iki instruction ekliyoruz
    const blockHash = await connection.getLatestBlockhash()
    const message = new TransactionMessage({
        instructions: [createNewPlanetAccountIx, ix],
        payerKey: payer.publicKey,
        recentBlockhash: blockHash.blockhash
    }).compileToV0Message()



    const tx = new VersionedTransaction(message)
    tx.sign([payer, planetKeyPair])

    // İşlemi gönderme ve imzayı konsola yazdırma
    const signature = await connection.sendTransaction(tx)
    console.log("İşlem İmzası:", signature)
    console.log(planetKeyPair.publicKey.toString())
}


const newplanetPublicKey = new PublicKey("3bN3ZfyjPyGnV4ScMydrzRpUKkcQNNYJrtEP5Qiz1ezn")
const readPlanetAccount = async () => {

    const readAccountKey = new PublicKey("3bN3ZfyjPyGnV4ScMydrzRpUKkcQNNYJrtEP5Qiz1ezn")
    const accountInfo = await connection.getAccountInfo(readAccountKey);

    const data =  borsh.deserialize(planetSchema,accountInfo?.data!)
    console.log(data)
}



const authority = async () => {

    const exploredPlanetAccount = new PublicKey("3bN3ZfyjPyGnV4ScMydrzRpUKkcQNNYJrtEP5Qiz1ezn")
    console.log(payer.publicKey.toString())
    const ix = new TransactionInstruction ({
        programId: programId,
        keys: [
            {pubkey: exploredPlanetAccount, isSigner: false, isWritable: true },
            {pubkey: payer.publicKey, isSigner: true, isWritable: true }
        ],
        data: Buffer.from([2]),
    })

    const blockHash = await connection.getLatestBlockhash()
    const message = new TransactionMessage ({
        payerKey: payer.publicKey,
        instructions: [ix],
        recentBlockhash: blockHash.blockhash,
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([payer]);

   connection.sendTransaction(tx);
}



const addIfConfirme = async () => {
    const explorerAccount = new PublicKey("DKBk6Dqnt8eW5WeAQaxfR7tp7CVhCgdAvwM5bEj2Z4Z3")
    const exploredPlanetAccount = new PublicKey("3bN3ZfyjPyGnV4ScMydrzRpUKkcQNNYJrtEP5Qiz1ezn")

    const ix = new TransactionInstruction({
        programId: programId,
        keys: [
            {pubkey: explorerAccount, isSigner: false, isWritable: true },
            {pubkey: exploredPlanetAccount, isSigner: false, isWritable: true }        
        ],
        data: Buffer.from([3]),
    })

    const blockHash = await connection.getLatestBlockhash()
    const message = new TransactionMessage({
        instructions: [ix],
        payerKey: payer.publicKey,
        recentBlockhash: blockHash.blockhash
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([payer]);

    connection.sendTransaction(tx);
}

//createNewExplorerAccount("omer", "mercan", 23)
readExplorerAccount()
//createPlanet()
//readPlanetAccount()
//authority()
//addIfConfirme()
