import * as React from 'react'
import TopBar from '../Topbar'
import { Box } from '@mui/material';

export function Score({ data, user }) {

  const [scoreData, setScoreData] = React.useState(
    { title: "", id: "", myScore: 0, averageScore: 0, highest: 0, lowest: 0 }
  )

  function UrlParam(name) {
    var url = new URL(window.location.href),
      result = url.searchParams.get(name);
    return result
  }

  function getScore(id) {
    fetch("/api/getscore", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
      .then(res => res.json())
      .then(res => {
        console.log(res)

        fetch("/api/getscoremap", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
          .then(res2 => res2.json())
          .then(res2 => {
            console.log(res2)
            var t = false
            for (let i = 0; i < res2.data.result.length; i++) {
              if (res2.data.result[i].uid === id) {
                setScoreData(res2.data.result[i])
                t = true
                break
              }
              if (!t) {
                setScoreData(
                  {
                    "title": "找不到成績",
                    "id": "",
                    "averageScore": 0,
                    "highest": 0,
                    "lowest": 0,
                    "myScore": 0
                  }
                )
              }
              //  list.push({ title: res2.data.result[i].scoreName, id: res2.data.result[i].uid })
            }

          })
      })
  }

  React.useEffect(() => {
    getScore(UrlParam("q"))
  }, [])

  return (
    <>
      <TopBar logined={true} data={data.data} user={user} title={"首頁"} />

      <Box sx={{ p: 3 }}>

      </Box>
    </>
  )
}