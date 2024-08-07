import { Button, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";



const DexTrades = () => {
    const navigate = useNavigate();
  
    const handleSubmit = (event: { preventDefault: () => void; }) => {
      event.preventDefault();
      //console.log(event.target.pnl.value);
      // 👇️ redirect to
      const input = document.getElementById('pnl_input') as HTMLInputElement | null;
      console.log(input?.value);
      //console.log(input?.value);
      //add all the input filters here
      if (input != null && input?.value !='') {
        navigate('/pnl/'+input?.value); // 👉️ pnl
      }
      
      //<form onSubmit={handleSubmit}>
      //<input id="pnl_input" />
      //<button type="submit">Submit</button>
      //</form>
      // https://tonlearn.tools/#/pnl/EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke
      // https://tonlearn.tools/#/pnl/EQAxQzpBXpgLaf_wk0sjPkUSmECjCzD3f7U1EAAMqw_v1xEx
      // https://tonlearn.tools/#/pnl/EQD18dhkAGmKGJiWYPlIz0ltokUrE6ysXPzEKgxszxvqsy6R
  
    };
  
  
    return (
      <div className="vh-100 bg-dark">
      <Container fluid className="py-4 text-center" data-bs-theme="dark">
      <br />
    <p style={{ fontSize: "30px", fontWeight: "600"  }} className="text-white">TON PnL Analyzer</p>
    <p style={{ fontSize: "25px", fontWeight: "190"  }} className="text-white"> Use our Address Analyzer to quickly visualize the PnL (profit and loss)<br />and Trading History of your wallet address!</p>
    <br /> 
    <p className="text-secondary">Integrated over Dedust.io and Ston.fi for now!</p>
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Control style={{width:"50%"}} id="pnl_input" className='mx-auto' placeholder="Example: EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke"/>
        <Form.Text className="text-muted">
            Enter a wallet address in a friendly from. Ex: <span><a href="https://tonlearn.tools/#/pnl/EQDESqGp5eZH6uMku68uc_q35GC-xwCtqUqWrcWASVP8d6Ke" target="_blank" rel="noopener noreferrer">EQDE...d6Ke</a></span> <span><a href="https://tonlearn.tools/#/pnl/EQAkbIA32zna94YX1Oii371zF-CHOPHB8DLIJa1QBcdNNGmq" target="_blank" rel="noopener noreferrer">EQAk...NGmq</a></span> <span><a href="https://tonlearn.tools/#/pnl/EQD18dhkAGmKGJiWYPlIz0ltokUrE6ysXPzEKgxszxvqsy6R" target="_blank" rel="noopener noreferrer">EQD1...sy6R </a></span>
        </Form.Text>
      </Form.Group>
      <br/>
      <Button variant="primary"  type="submit">Submit Address</Button>
    </Form> 
    </Container>
  
    <Container fluid className="py-4 text-center" data-bs-theme="dark">
    <p style={{ fontSize: "25px", fontWeight: "190"  }} className="text-white">Discover TON Insights You Can't Get Anywhere Else</p>
    <br /> 
    <p style={{ fontSize: "20px", fontWeight: "190"  }} className="text-white"> Unlock the next level with blockchain analytics. More <a href="https://t.me/ton_learn">here</a></p>
    </Container>
  </div>
    );
  }

  export default DexTrades;