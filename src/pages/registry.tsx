// pages/registry.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { Connection, clusterApiUrl, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import axios from 'axios';

const Registry = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    userName: '',
    aiAgentId: '',
    aiAgentWalletAddress: '',
    linkedinLogin: '',
    xLogin: '',
    discordLogin: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  useEffect(() => {
    fetchEntries();
  }, []);

  // Fetch existing entries from the API
  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/registry');
      setEntries(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Handle profile image change
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  // Create a new entry and sign the data to log it on chain
  const handleCreateEntry = async () => {
    if (!connected || !publicKey || isCreating) return;
    setIsCreating(true);

    try {
      // Create a message to sign
      const message = `Registering User: ${formData.userName}, AI Agent ID: ${formData.aiAgentId}, AI Agent Wallet Address: ${formData.aiAgentWalletAddress}, LinkedIn Login: ${formData.linkedinLogin}, X Login: ${formData.xLogin}, Discord Login: ${formData.discordLogin}`;

      // Create a transaction and add a memo
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Sending to itself for signing purposes
          lamports: 0, // Zero lamports to just log the message
        })
      );

      // Fetch the latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      console.log("Signed Transaction:", signedTransaction);

      // Optionally, send the signed transaction to the blockchain
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log("Transaction Signature:", signature);

      // Prepare form data to send to backend API
      const formDataToSend = new FormData();
      formDataToSend.append('ownerWalletAddress', publicKey.toBase58());
      formDataToSend.append('userName', formData.userName);
      formDataToSend.append('aiAgentId', formData.aiAgentId);
      formDataToSend.append('aiAgentWalletAddress', formData.aiAgentWalletAddress);
      formDataToSend.append('linkedinLogin', formData.linkedinLogin);
      formDataToSend.append('xLogin', formData.xLogin);
      formDataToSend.append('discordLogin', formData.discordLogin);
      formDataToSend.append('signedMessage', message);
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      // Log entry to backend API
      const response = await axios.post('/api/registry', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setEntries([...entries, response.data]);

      // Reset the form data
      setFormData({
        userName: '',
        aiAgentId: '',
        aiAgentWalletAddress: '',
        linkedinLogin: '',
        xLogin: '',
        discordLogin: '',
      });
      setProfileImage(null);
    } catch (error) {
      console.error('Error while creating and signing entry:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: '10px',
      borderRadius: '12px',
      maxWidth: '100%',
      margin: '25px auto',
    }}>
      <h1 style={{ fontSize: '2em', color: '#333', marginBottom: '20px' }}>Partner & Agent Registry</h1>
      {connected ? (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          backgroundColor: '#e0e0e0',
          padding: '10px',
          borderRadius: '8px',
        }}>
          <form onSubmit={(e) => e.preventDefault()} style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              backgroundColor: '#d3d3d3',
              borderRadius: '8px',
              width: '75%',
            }}>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                Profile Image:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                User Name / Pseudonym:
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                LinkedIn Login:
                <input
                  type="text"
                  name="linkedinLogin"
                  value={formData.linkedinLogin}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                X Login:
                <input
                  type="text"
                  name="xLogin"
                  value={formData.xLogin}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                Discord Login:
                <input
                  type="text"
                  name="discordLogin"
                  value={formData.discordLogin}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              backgroundColor: '#d3d3d3',
              borderRadius: '8px',
              width: '45%',
            }}>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                AI Agent Name:
                <input
                  type="text"
                  name="aiAgentName"
                  value={formData.aiAgentId}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                AI AgentID:
                <input
                  type="text"
                  name="aiAgentId"
                  value={formData.aiAgentId}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ color: '#333', fontWeight: 'bold', marginBottom: '10px' }}>
                AI Agent Wallet Address:
                <input
                  type="text"
                  name="aiAgentWalletAddress"
                  value={formData.aiAgentWalletAddress}
                  onChange={handleChange}
                  style={{
                    color: '#000',
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    width: '100%',
                  }}
                />
              </label>
            </div>
            <button
              onClick={handleCreateEntry}
              disabled={isCreating}
              style={{
                color: '#fff',
                backgroundColor: isCreating ? '#aaa' : '#0070f3',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                marginTop: '10px',
                alignSelf: 'center',
              }}
            >
              {isCreating ? 'Creating...' : 'Create Entry'}
            </button>
          </form>
          <ul style={{
            marginTop: '20px',
            width: '100%',
            listStyleType: 'none',
            padding: '0',
          }}>
            {entries.map((entry) => (
              <li key={entry.id} style={{
                backgroundColor: '#fff',
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '15px',
              }}>
                <b>Owner (User Wallet):</b> {entry.ownerWalletAddress}<br />
                <b>Partner Name / Pseudonym:</b> {entry.userName}<br />
                <b>AI Agent Name:</b> {entry.aiAgentName}<br />
                <b>AI Agent ID:</b> {entry.aiAgentId}<br />
                <b>AI Agent Wallet Address:</b> {entry.aiAgentWalletAddress}<br />
                <b>LinkedIn Login:</b> {entry.linkedinLogin}<br />
                <b>X Login:</b> {entry.xLogin}<br />
                <b>Discord Login:</b> {entry.discordLogin}<br />
                <b>Signed Message:</b> {entry.signedMessage}<br />
                <b>Timestamp:</b> {entry.timestamp}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ fontSize: '1.2em', color: '#ff0000', marginTop: '20px' }}>Please connect your wallet to interact with the registry.</p>
      )}
    </div>
  );
};

export default Registry;
