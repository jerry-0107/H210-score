import './App.css';
import LoginForm from './LoginForm';
import React, { useState } from 'react';
import { Homepage } from './pages/home';
import { Route, Routes } from 'react-router-dom'
import { Score } from './pages/score';
import { TeacherHomePage } from './pages/teacherHome';
import { AllScoreSheet } from './pages/allscores';
import { PushNewScore } from './pages/pushNewScore';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { SearchScoreSheet } from './pages/searchScores';
import { AllAccountSheet } from './pages/allaccounts';
import { StudentAccounts } from './pages/studentaccounts';
import { ParentAccounts } from './pages/parentaccounts';
import { TeacherScore } from './pages/teacherscore';
import { Profile } from './pages/profile';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Setting } from './pages/setting';
import useMediaQuery from '@mui/material/useMediaQuery';
import { StdScore } from './pages/stdscore';
import Routing from './pages/route';

function App() {
  const [loading, setLoading] = React.useState(true)

  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem(""));
  const [userData, setUserData] = useState([])

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
    },
  });


  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const systemTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const currentTheme = (
    localStorage.getItem("theme") == "light" ? lightTheme :
      localStorage.getItem("theme") == "dark" ? darkTheme :
        systemTheme
  )

  function handleCallBack(data) {
    setUserData(data)
  }

  React.useEffect(() => {
    fetch("/api/checklogin", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page: window.location.pathname + window.location.search }),
    })
      .then(res => res.json())
      .then(res => {
        setLoading(false)
        if (res.logined) {
          setIsLoggedIn(res.logined)
          setUserData(res.data)
        }

      })
  }, [])

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      {!loading ?
        isLoggedIn ?
          <Routes>
            <Route path='/profile' element={<Profile data={userData} />} ></Route>
            <Route path='/setting' element={<Setting data={userData} />} ></Route>
            <Route path='/route/to' element={<Routing data={userData} />} ></Route>

            {userData.data.role === "teacher" ?
              <Route path='/' element={<TeacherHomePage data={userData} />} ></Route>
              : <Route path='/' element={<Homepage data={userData} />} ></Route>
            }
            {userData.data.role === "std" ?
              <Route path='/score/more' element={<StdScore data={userData} />} ></Route>
              : <></>}

            {
              userData.data.role !== "teacher" ?
                <Route path='/score' element={<Score data={userData} />} ></Route>
                :
                <Route path='/score' element={<SearchScoreSheet data={userData} />} ></Route>

            }


            {userData.data.role === "teacher" ?
              <>
                <Route path='/backend' element={<TeacherHomePage data={userData} />}></Route>
                <Route path='/backend/score' element={<AllScoreSheet data={userData} />}></Route>
                <Route path='/backend/score/push' element={<PushNewScore data={userData} />}></Route>
                <Route path='/backend/score/search' element={<SearchScoreSheet data={userData} />} ></Route>

                <Route path='/backend/account' element={<AllAccountSheet data={userData} />}></Route>
                <Route path='/backend/account/student' element={<StudentAccounts data={userData} />}></Route>
                <Route path='/backend/account/parent' element={<ParentAccounts data={userData} />}></Route>
                <Route path='/score/class' element={<TeacherScore data={userData} />}></Route>

              </>
              : <></>}
            <Route path='*' element={<Homepage data={userData} />}></Route>

          </Routes>
          :
          <Routes>
            <Route path='*' element={<LoginForm set={setIsLoggedIn} callback={handleCallBack} />} ></Route>
          </Routes>
        :
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

      }
    </ThemeProvider>
  );
}

export default App;
