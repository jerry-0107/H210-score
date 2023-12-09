import * as React from 'react'
import { ErrorPage } from './pages/errorPage'

export function CheckLogin({ run, userData }) {
    const [pageError, setPageError] = React.useState([false, 0])

    const [ui, setUi] = React.useState(<></>)
    React.useEffect(() => {
        if (run && !window.location.href.includes("/route/to")) {
            fetch("/api/checklogin", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page: window.location.pathname + window.location.search
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (!res.logined) {
                        alert("請重新登入")
                        window.location.reload()
                    }

                })
        }
    }, [])

    return <>{ui}</>
}