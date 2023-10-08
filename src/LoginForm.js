import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import { Paper } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useRef } from 'react';
import "../src/app.css"


function LoginForm({ set, callback }) {
  const [userid, setuserid] = useState('');
  const [password, setPassword] = useState('');
  const [showDialog, setShowDialog] = useState(false)
  const submitButttonRef = useRef()

  const handleLogin = async () => {
    await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userid, password }),
    })
      .then(res => res.json())
      .then(
        (res) => {
          if (res.ok) {
            //alert("登入成功")
            set(true)
            callback(res)
          } else {
            alert("帳號或密碼不正確!!")
          }
        }
      )

  };

  function showDialogF() {
    setShowDialog(true)
  }
  React.useEffect(() => {
    document.title = "登入 - H210成績查詢系統"
  }, [])

  React.useEffect(() => {

    const handleKeyDown = (event) => {
      if (event.keyCode === 13 && submitButttonRef.current) {
        submitButttonRef.current.click()
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitButttonRef, userid, password])

  return (
    <>

      <Paper sx={{
        p: 2,
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        flexDirection: "column",
        flexWrap: "wrap",
        alignContent: "space-around",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        backdropFilter: " blur(5px)",
        width: "fit-content",
        height: "fit-content",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translateX(-50%) translateY(-50%)",
      }}>
        <center>
          <h1 style={{ margin: 0 }}>H210</h1>
          <h2 style={{ margin: 0 }}>成績查詢系統</h2>
          <TextField type='text' value={userid} id="userid-input" label="帳號" variant="standard" onChange={(e) => setuserid(e.target.value)} />
          <p></p>
          <TextField type='password' value={password} onChange={(e) => setPassword(e.target.value)} id="userpassword-input" label="密碼" variant="standard" />
          <p></p>
          <Button ref={submitButttonRef} variant="contained" onClick={handleLogin}>開始查詢</Button>
          &nbsp;
          <Button variant="outlined" sx={{ ml: 1, display: "none" }} onClick={() => showDialogF()}>帳密提示</Button>
        </center>
      </Paper >

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"帳密提示"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            〈學生〉<br />
            帳號為s加學號，密碼為身份證後四碼
            <p></p>
            〈家長〉
          </DialogContentText>
        </DialogContent>
        <DialogActions>

          <Button onClick={() => setShowDialog(false)} autoFocus>
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LoginForm;
