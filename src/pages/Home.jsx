import React, { useState } from 'react'
import Dashboard from './Dashboard'
import BookingStatus from './BookingStatus'
import Inventory from './Inventory'
import Analytics from './Analytics'
import Rooms from './Rooms'
import Layout from '../ui/Layout'

export default function Home() {

    const [selectedSection, setSelectedSection] = useState('dashboard')

   const renderSection=()=>{
    switch(selectedSection){
      case 'dashboard':
        return <Dashboard />
      case 'rooms':
        return <Rooms />
      case 'bookingstatus':
        return <BookingStatus />
      case 'inventory':
        return <Inventory />
      case 'analytics':
        return <Analytics />
      default:
        return <Dashboard />
    }
   }

   return (
    <Layout selectedSection={selectedSection} onSectionChange={setSelectedSection}>
      {renderSection()}
    </Layout>
  );
}