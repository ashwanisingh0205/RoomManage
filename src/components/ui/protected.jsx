import React from 'react'
import { Navigate } from 'react-router'

export default function ProtectedRoute({children}) {
    const data=sessionStorage.getItem("token")
    if(!data){
        return <Navigate to="/login" />
    }
 
    return children
}
