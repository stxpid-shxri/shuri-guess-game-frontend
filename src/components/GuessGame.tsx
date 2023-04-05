import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import { Program, AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import idl from "./guess_number.json";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useState, useEffect } from 'react'

const idl_str = JSON.stringify(idl);
const idl_obj = JSON.parse(idl_str);
const programId = new PublicKey(idl.metadata.address);
const masterPublicKey = '2zW8PGjPdiLzcQqHpiSStuDbV15rSbbnUic8KrTCfXx7';

export const GuessGame: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection();
    const [master, setMaster]= useState({
        pubkey: '',
        account: {
          lamports: 0,
          owner: '',
          executable: false,
          rentEpoch: 0,
        },});
    
    const [game, SetGame] = useState();
    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    }

    const fetchCurrentPool = async () => {
        const anchProvider = getProvider();
        const program = new Program(idl_obj, programId, anchProvider);
        try {
            const programAccounts = await connection.getParsedProgramAccounts(programId);
            const parsedAccounts = programAccounts.map(({ pubkey, account }) => 
            (
                {
                pubkey: pubkey.toString(),
                account: {
                  lamports: account.lamports,
                  owner: account.owner.toString(),
                  executable: account.executable,
                  rentEpoch: account.rentEpoch,
                },
              }));

             parsedAccounts.forEach( x => {
                if (x.pubkey ==='2zW8PGjPdiLzcQqHpiSStuDbV15rSbbnUic8KrTCfXx7') {   
                    setMaster(x);
                    console.log(master);
                }
             }

             )

        } catch (error) {
            console.log("error: " + error);
        }
    }

    const createGuessGame = async () => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_obj, programId, anchProvider);

            // find program id of game
            const [game] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode('game'),
                anchProvider.wallet.publicKey.toBuffer()
            ], program.programId);

            // should set random number from 1-5;
            let number = 0
            await program.rpc.create(number, {
                accounts: {
                    game,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });

            console.log("New game added: " + game.toString());

            // set pubkey here to be use on play
            // SetGame(game);
        } catch (error) {
            console.log('Error:' + error);
        }
    }

    const playGame = async () => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_obj, programId, anchProvider);

            // selected number should be from input text
            let selectedNumber = 4;
            await program.rpc.play(new BN(0.1 * LAMPORTS_PER_SOL), selectedNumber, {
                accounts: {
                    game: game,
                    master: masterPublicKey,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });

            console.log("Game is done " + game);
        } catch (error) {
            console.log('Error:' + error);
        }
    }
    
    return (
        <>  
            { master &&                 
                    <div className='md:hero-content flex flex-col'>
                        <h1>Prize pool:</h1>
                        <h2>Number to guess between (1-5): ???</h2>
                        <button
                            className='group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500'
                            onClick={createGuessGame}
                        >
                            <span>
                             Create Guess Game
                            </span>
                        </button>
    
                        <input className="p-2 text-black" type="number" min={1} max={5}></input>
                        <button
                            className='group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500'
                            onClick={playGame}
                        >
                            <span>
                                Play Game
                            </span>
                        </button>
                    </div>
                }
            <div className="flex flex-row justify-center">
                <>
                    <div className="relative group items-center">
                        <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={fetchCurrentPool}
                        >
                            <span className="block group-disabled:hidden" >
                                Fetch Current Prize Pool
                            </span>
                        </button>
                    </div>
                </>
            </div>
        </>
    );
}