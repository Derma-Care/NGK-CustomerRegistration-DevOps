/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { CButton, CFormInput, CRow, CCol, CFormLabel } from '@coreui/react'
import OnboardSuccess from './OnboardSuccess'
import { useNavigate } from 'react-router-dom'
import { updateStep2 } from '../APIs/FinalRegistrationApi'

import { showCustomToast } from '../../../Utils/Toaster'
import { NGK_COLORS } from '../../../Constant/Themes'

import ClipLoader from 'react-spinners/ClipLoader'
import '../CustomerRrgistration/Register.css'
import { isValidAddress } from '../Utills/isValidAlphaNumericName'
export default function RefferalCodeAddress({ form, setForm,error }) {
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [addressError, setAddressError] = useState('')

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      showCustomToast('Location not supported', 'error')
      return
    }

    setLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          )
          const data = await res.json()

          updateForm('address', data.display_name || '')
          setAddressError('')
        } catch {
          showCustomToast('Unable to fetch address', 'error')
        }
        setLoadingLocation(false)
      },
      () => {
        showCustomToast('Location permission denied', 'error')
        setLoadingLocation(false)
      },
    )
  }

  return (
   <CRow className="g-2 align-items-end">
  {/* Address Input */}
  <CCol xs={12} md={9}>
    <CFormLabel    className="label-gradient  "
                          style={{ color: NGK_COLORS.primarySoft }}>
      Full Address <span className="text-danger">*</span>
    </CFormLabel>

    <CFormInput
      placeholder="House No, Street, Area, Village, Pincode"
      value={form.address}
      onChange={(e) => {
        const value = e.target.value
        updateForm('address', value)

        if (isValidAddress(value)) setAddressError('')
      }}
      onBlur={() => {
        if (!form.address || !isValidAddress(form.address)) {
          setAddressError(
            'Please enter complete address (House No, Street, Area, Village, Pincode)'
          )
        }
      }}
    />

    {addressError && (
      <p style={{ color: 'red', fontSize: 13 }}>{addressError}</p>
    )}
  </CCol>

  {/* Location Button */}
<CCol
  xs={12}
  md={3}
  className="d-flex justify-content-md-center justify-content-start"
>
  <CButton
    variant="outline"
    onClick={handleGetLocation}
    disabled={loadingLocation}
    style={{
      width: '100%',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    }}
  >
    {/* 📍 Icon */}
    <span style={{ fontSize: '16px' }}>📍 Use location</span>

    {/* Loader */}
    {loadingLocation && (
      <ClipLoader size={14} color={NGK_COLORS.primary} />
    )}

    {/* ✅ Text for MOBILE + SM */}
    <span className="d-inline d-md-none">
      {loadingLocation ? 'Fetching…' : ''}
    </span>
  </CButton>
</CCol>



</CRow>

  )
}
