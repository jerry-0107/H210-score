import * as React from 'react'
import TopBar from '../Topbar'
import { Box, Button } from '@mui/material';
import "../App.css"
import { red, yellow, green } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
import { styled } from '@mui/material/styles';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { InputForm } from '../inputBoxs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export function TeacherScore({ data, user }) {
    const [students, setStudents] = React.useState([
        { username: "", userpassword: "" }
    ])
    var idList = [0]
    const [password, setPassword] = React.useState('');
    const [auth, setAuth] = React.useState(true)
    const [scoreTitle, setScoreTitle] = React.useState()

    const authBtnRef = React.useRef()
    const newPasswordInputRef = React.useRef()
    const [newPass, setNewPass] = React.useState()
    const [dialogSubmitBtnText, setDialogSubmitBtnText] = React.useState(<>更新</>)

    const [accountValues, setaccountValues] = React.useState(Array(45));
    const [passwordValue, setPasswordValue] = React.useState(Array(45))

    function UrlParam(name) {
        var url = new URL(window.location.href),
            result = url.searchParams.get(name);
        return result
    }


    const [open, setOpen] = React.useState(false);
    const [openingId, setOpeningId] = React.useState(
        { username: "", userpassword: "" }
    )

    const handleClickOpen = (n) => {
        setOpen(true);
        setOpeningId(n)
    };

    const handleClose = (n) => {

        setDialogSubmitBtnText(<><CircularProgress size="1rem" /> 更新中</>)
        if (n === "update") {
            fetch('/api/changepassword/student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: (openingId.id), password: (newPass) }),
            })
                .then(res => res.json())
                .then(
                    (res) => {
                        setDialogSubmitBtnText("更新完畢")
                        setOpen(false)
                        getAllStdPass()
                        setNewPass("")
                        setDialogSubmitBtnText("更新")

                    }
                ).catch((e) => {
                    getAllStdPass()
                    setNewPass("")
                    setDialogSubmitBtnText("更新失敗，請重試")
                })

        } else {
            setOpen(false)
            setDialogSubmitBtnText("更新")

        }
    };

    const handleSubmit = () => {
        // 在這裡處理提交操作，您可以使用inputValues數組中的值
        console.log('輸入框的值：', passwordValue);
    };

    const editPass = (i, p) => {
        handleClickOpen(i)
    }

    const handleLogin = async () => {
        await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userid: (data.data.userid), password: password }),
        })
            .then(res => res.json())
            .then(
                (res) => {
                    if (res.ok) {
                        setAuth(true)
                    } else {
                        alert("密碼錯誤!!\n你已經被自動登出，請重新登入")
                        window.location.reload()
                    }
                }
            )

    };

    function getAllStdPass() {
        fetch("/api/getallstudentscorebyid", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid: UrlParam("q")
            }),
        })
            .then(res => res.json())
            .then(res => {
                console.log(".......0", res)
                var list = []
                console.log(res)
                for (let i = 0; i < res.data.result.length; i++) {

                }
                setStudents(list)
                console.log(students, list, idList)
            })

    }



    return (
        <>

            <TopBar logined={true} data={data.data} user={user} title={"家長帳密"} />

            <Box sx={{ p: 3 }}>
                <h1>{ }</h1>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>

                                <TableCell>座號</TableCell>
                                <TableCell>姓名</TableCell>
                                <TableCell>成績</TableCell>
                                <TableCell>備註</TableCell>
                                <TableCell>動作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((row, i) => (
                                <TableRow
                                    key={row.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >

                                    <TableCell>{row.username}</TableCell>
                                    <TableCell>{row.accountInput}</TableCell>
                                    <TableCell>{row.passwordInput}</TableCell>
                                    <TableCell>{row.changePasswordBtn}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>





            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"更新 " + (openingId.username ? openingId.username : "") + " 的密碼"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        目前密碼:{openingId.userpassword ? openingId.userpassword : "" || "???"}<br />
                        <p></p>
                        <TextField type='text' variant="standard" label="輸入新密碼" ref={newPasswordInputRef} value={newPass} onInput={(e) => setNewPass(e.target.value)} />
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>取消</Button>
                    <Button onClick={() => handleClose("update")}>
                        {dialogSubmitBtnText}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}