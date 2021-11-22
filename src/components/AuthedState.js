import { NFTStorage, File, toGatewayURL } from "nft.storage";
import Dropzone from "react-dropzone";
import { useState, useEffect } from "react";
import { config } from "@onflow/fcl";
import * as fcl from "@onflow/fcl";
import { Api } from "../apis";

const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQ1MDM0ODYwNERBMzhiNTM5OTQ3ZTg5RUYyMjcwMjZBOEY5NmNjOEEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNjI5Mjk1ODcwMSwibmFtZSI6Im9uZmxvdy1jZGMifQ.LJA8DkRsj7bCqa9KjKqUTfnH_5otaxMsreZYG9IUIOo";

const clientNFTStorage = new NFTStorage({ token: apiKey });

const _getCid = (ipfsLink) => {
  const _parts = ipfsLink.split("/");
  if (_parts.length > 3) {
    return _parts[_parts.length - 2];
  } else {
    return null;
  }
};
const ipfsHttpLink = (ipfsLink) => {
  const _cid = _getCid(ipfsLink);
  return `https://ipfs.io/ipfs/${_cid}`;
};

const AuthedState = ({ user }) => {
  const [nftName, setNftName] = useState();
  const [nftDesc, setNftDesc] = useState();
  const [file, setFile] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAccSetup, setIsAccSetup] = useState();
  const [transactionStatus, setTransactionStatus] = useState(null);

  const transferNft = (nftId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const transactionId = await fcl.mutate({
          cadence: `
            import NonFungibleToken from 0xfb7fb8b56a762069
            import ProvenancedTest1 from 0xe601ef1f3ff75421
            
            transaction(recipient: Address,id: UInt64) {
                
              let transferToken: @NonFungibleToken.NFT
            
              prepare(signer: AuthAccount) {
  
                  let collectionRef = signer.borrow<&ProvenancedTest1.Collection>(from: ProvenancedTest1.CollectionStoragePath)
                      ?? panic("Could not borrow a reference to the owner's collection")
  
                  self.transferToken <- collectionRef.withdraw(withdrawID: id)
              }
  
              execute {
                
                  let recipient = getAccount(recipient)
  
                  let receiverRef = recipient
                      .getCapability(ProvenancedTest1.CollectionPublicPath)!
                      .borrow<&{NonFungibleToken.CollectionPublic}>()
                      ?? panic("Could not get receiver reference to the NFT Collection")
  
                  receiverRef.deposit(token: <-self.transferToken)
  
                  log("NFT ID 1 transferred from account 2 to account 1")
              }
  
          }
            `,
          args: (arg, t) => [
            arg(user.addr, t.Address),
            arg(nftId, t.UInt64)
          ],
          payer: fcl.authz,
          proposer: fcl.authz,
          authorizations: [fcl.authz],
          limit: 50,
        });
     

        fcl.tx(transactionId).subscribe((res) => {
          console.log("res : ", res);
          resolve(res);
          setTransactionStatus(res.status);
        });
      } catch (ex) {
        reject(ex);
      }
    });
  };

  const checkAccountInitialized = async () => {
    if (!user) return;
    const res = await fcl.query({
      cadence: `
        import NonFungibleToken from 0xfb7fb8b56a762069
        import ProvenancedTest1 from 0xe601ef1f3ff75421
        
        
        pub fun main(address:Address) : Bool {
            let account = getAccount(address)
            let res = ProvenancedTest1.checkInitialized(address: address)
            return res
        }
      `,
      args: (arg, t) => [arg(user?.addr, t.Address)],
    });

    console.log("query result : ", res);
    setIsAccSetup(res);
  };

  const initAccount = async () => {
    // const transactionId = await fcl.mutate({
      console.log('fcl.authz' , fcl.authz);
    // try {

      var transactionId = await fcl.send([
        fcl.transaction`
        import NonFungibleToken from 0xfb7fb8b56a762069
        import ProvenancedTest1 from 0xe601ef1f3ff75421
        
        transaction {
          let address: Address
      
          prepare(currentUser: AuthAccount) {
      
            self.address = currentUser.address
            let account= getAccount(self.address)
            let artCollection = currentUser.getCapability(ProvenancedTest1.CollectionPublicPath).borrow<&{ProvenancedTest1.ProvenancedTest1CollectionPublic}>()
      
            if artCollection == nil {
      
              let collection <- ProvenancedTest1.createEmptyCollection()
              currentUser.save(<-collection, to: ProvenancedTest1.CollectionStoragePath)
              currentUser.link<&ProvenancedTest1.Collection{NonFungibleToken.CollectionPublic, ProvenancedTest1.ProvenancedTest1CollectionPublic}>(ProvenancedTest1.CollectionPublicPath, target: ProvenancedTest1.CollectionStoragePath)
              log("account is initialized")
            } else {
              log("account was already initialized")
            }
          }
          post {
      
             getAccount(self.address).getCapability(ProvenancedTest1.CollectionPublicPath).borrow<&{ProvenancedTest1.ProvenancedTest1CollectionPublic}>() != nil : "Account is not initialized"
            
          }
        }
        `,
        fcl.proposer(fcl.currentUser().authorization),
        fcl.authorizations([
          fcl.currentUser().authorization,
        ]),
        fcl.payer(fcl.currentUser().authorization),
        fcl.limit(100),
      ])
    

      const  transaction = await fcl.tx(transactionId).onceSealed()

      // fcl.tx(transactionId).subscribe((res) => {
      //   console.log("res : ", res);
      //   // resolve(res);
      //   setTransactionStatus(res.status);
      // });

      // console.log("transaction -> ", transaction);
    // } catch (ex) {
    //   console.error("exception : ", ex);
    //   setTransactionStatus("exception : " + JSON.stringify(ex, null, 2));
    // }
  };

  const getAccountInfoQuery = async () => {
    if (!user) return;
    const res = await fcl.query({
      cadence: `
        import NonFungibleToken from 0xfb7fb8b56a762069
        import ProvenancedTest1 from 0xe601ef1f3ff75421        
        
        pub fun main(address:Address) : [ProvenancedTest1.NftData] {
            let account = getAccount(address)
            let nft = ProvenancedTest1.getNft(address: address)
            return nft
        }
      `,
      args: (arg, t) => [arg(user?.addr, t.Address)],
    });

    console.log("query result : ", res);

    setNfts(res);
  };

  const uploadFileToNFTStorage = async () => {
    const _file = file[0];

    const metadata = await clientNFTStorage.store({
      name: nftName,
      description: nftDesc,
      image: new File([_file], _file.name, { type: _file.type }),
    });

    console.log(
      "nft storage submitted metadata : ",
      JSON.stringify(metadata, null, 2)
    );

    if (metadata && metadata.url) {
      const httpLink = toGatewayURL(metadata.url);
      console.log("httpLink: ", httpLink);
      console.log("httpsLink : ", httpLink.href);

      const _fileUrl = ipfsHttpLink(metadata.url);

      //* bafyreigb7qezbgh7z5dv6yogltx4kovufnmpuqjj4v377mh3u4bknv25ei/metadata.json
      const cidMetadataLink = httpLink.pathname.replace("/ipfs/", "");
      return cidMetadataLink;
    }
    return null;
  };

  const mintNft = async () => {
    if (file.length == 0) {
      alert("please select file!");
      return;
    }

    if (!nftName || !nftDesc) {
      alert("Please enter name and description.");
      return;
    }

    try {
      setIsUploading(true);
      const cidMetadata = await uploadFileToNFTStorage();
      if (!cidMetadata) {
        setIsUploading(false);
        alert("Failed to upload meta data, please try after a moment.");
        return;
      }
      console.log("cidMetadataLink : ", cidMetadata);

      const resMint = await Api.mintReq(user.addr, cidMetadata);
      console.log('resMint:', resMint);
      // if (resMint.status == 200) {
      //   //todo transfer NFT;
      //   const nftId = resMint.lastNftId;
      //   console.log("lastNftId: ", nftId);
      //   const resTransfer = await transferNft(nftId);
      //   console.log("resTransfer : ", resTransfer);
      // } else {
      //   alert(resMint.error);
      // }
    } catch (ex) {
      alert(ex.message);
      console.error("excetion : ", ex);
      setTransactionStatus("Exception: " + JSON.stringify(ex, null, 2));
    }
    setIsUploading(false);
  };

  return (
    <div class="main-warpper">
      <div>Address: {user?.addr ?? "No Address"}</div>
      {user.addr && (
        <button onClick={getAccountInfoQuery}>Get Account NFTs</button>
      )}
      <button onClick={fcl.unauthenticate}>Log Out</button>

      <button onClick={checkAccountInitialized}>CheckAccount Status</button>
      <button onClick={initAccount}>Account Init</button>

      <div>
        <h5>My NFTS: {nfts.length}</h5>
      </div>
      <div>
        <h5>
          Account is Setup:{" "}
          {isAccSetup === undefined ? "--" : isAccSetup.toString()}
        </h5>
      </div>

      <div className="input_group">
        <label>Metadata name</label>
        <input
          type="text"
          style={{ display: "block" }}
          value={nftName}
          onChange={(e) => {
            setNftName(e.target.value);
          }}
        ></input>
      </div>
      <div className="input_group">
        <label>Metadata description</label>
        <textarea
          value={nftDesc}
          onChange={(e) => {
            setNftDesc(e.target.value);
          }}
        ></textarea>
      </div>

      <div className="drop-container">
        <Dropzone
          onDrop={(acceptedFiles) => {
            console.log(acceptedFiles);
            setFile(acceptedFiles);
          }}
          maxFiles={1}
        >
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop file here, or click to select file</p>
                {file.map((one) => (
                  <li key={one.path}>
                    {one.path} - {one.size} bytes
                  </li>
                ))}
              </div>
            </section>
          )}
        </Dropzone>
      </div>
      <div>
        {isUploading ? (
          <span>Minting.....</span>
        ) : (
          <button onClick={mintNft}>Mint NFT</button>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        Transaction Status: {transactionStatus ?? "--"}
      </div>
    </div>
  );
};

export default AuthedState;
