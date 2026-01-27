/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react'
import {
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CRow,
  CCol,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import DermaCareLogo from '../../../assets/images/logoP.png'
import bgLogo from '../../../assets/images/bgLogo.png'
import '../CustomerRrgistration/Register.css'

import Select from 'react-select'
import { showCustomToast } from '../../../Utils/Toaster'

import { registerCustomer, registerCustomerRf } from '../APIs/registerCustomerApi'
import { verifyRegistrationCode } from '../APIs/verifyRegistrationCode'

import { processFile } from '../Utills/fileUtils'
import { UploadedPreview } from '../Utills/FileUpload'
import { getAllProcedures } from '../APIs/procedureService'
import { getCustomerByCode } from '../APIs/customerApiUsingRC'

import { NGK_COLORS } from '../../../Constant/Themes'
import { wifiUrl } from '../../../baseUrl'
import AadhaarConsentModal from './AadhaarConsentModal'
import UserConsentModal from './UserConsentModal'
import CIcon from '@coreui/icons-react'
import { cilCalendar } from '@coreui/icons'
import {
  isOnlyAlphabetsWithSpecialChars,
  isValidAadhaarName,
  isValidAddress,
  isValidAlphaNumericName,
} from '../Utills/isValidAlphaNumericName'
import RefferalCodeAddress from './RefferalCodeAddress'
import { useNavigate } from 'react-router-dom'
export default function CustomerRegistrationRefferalCode() {
  const today = new Date()
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

  const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())

  // subtract 12 months
  const past1Year = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

  const minDate12Months = past1Year.toISOString().split('T')[0]
  const maxToday = today.toISOString().split('T')[0]
  const [aadharVerified, setAadharVerified] = useState(false)
  const [winnerPrize, setWinnerPrize] = useState(null)
  const [spinWhell, setSpinWhell] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [procedureOptions, setProcedureOptions] = useState([])
  const [userData, setUserData] = useState([])
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showWheel, setShowWheel] = useState(false)
  const [instagram, setInstagram] = useState(false)
  const [isRegistration, setIsRegistration] = useState(true)
  const [showAadhaarModal, setShowAadhaarModal] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [serviceStatusError, setServiceStatusError] = useState('')
  const [cityList, setCityList] = useState([])
  const [highlightAadhaarConsent, setHighlightAadhaarConsent] = useState(false)
  const [cityOptions, setCityOptions] = useState([])
 const navigate = useNavigate()
  const indianSkinTones = [
    { value: 'Very Fair', label: 'Very Fair' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Wheatish', label: 'Wheatish' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Dusky', label: 'Dusky' },
    { value: 'Dark', label: 'Dark' },
    { value: 'Other', label: 'Other' },
  ]

  useEffect(() => {
    async function fetchProcedures() {
      const list = await getAllProcedures()

      const formatted = list.map((item) => ({
        value: item.procedureId,
        label: item.procedureName,
      }))
      formatted.push({
        value: 'other',
        label: 'Others',
      })

      setProcedureOptions(formatted)
    }

    fetchProcedures()
  }, [])

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    // email: '',
    city: '',
    otherCity: '',
    dob: '',

    clinicName: '',
    clinicCityArea: '',
    dateOfLastVisit: '',
    serviceType: [],
    // blood: '',
    // registraionCode: '',
    // referBy: '',
    Aadhar: '',
    prescription: '',
    referBy: '',
    otherServiceName: '',
    gender: '',

    address: '',
    referralCode: '',
    // Interested flow
    serviceStatus: '',
    interestCategory: '',
    otherInterestCategory: '',
    problemDescription: [],
    skinTone: '',
    samplePhoto: '',
    aadhaarConsent: false,
    userConsent: false,
    privacyConsent: false,
  })

  const serviceStatusRef = React.useRef(null)

  function calculateAge(dobStr) {
    if (!dobStr) return 0
    const today = new Date()
    const dob = new Date(dobStr)

    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--

    return age
  }

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleProcedureChange = (selected) => {
    const labels = selected.map((item) => (item.value === 'other' ? 'other' : item.label))

    setForm((prev) => ({
      ...prev,
      serviceType: labels,
    }))
    setErrors((prev) => ({ ...prev, serviceType: null }))
  }

  const showOtherInput = form.serviceType?.includes('other')

  function handleChange(e) {
    const { name, value, type, checked } = e.target

    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value }

      if (name === 'serviceStatus' && !checked) {
        next.clinicName = ''
        next.clinicCityArea = ''
        next.dateOfLastVisit = ''
        next.serviceType = ''
        next.registraionCode = ''
        next.referBy = ''
      }

      return next
    })

    setErrors((prev) => {
      const n = { ...prev }
      delete n[name]
      return n
    })
  }

  function formatAndValidateDateInput(raw) {
    let digits = raw.replace(/\D/g, '').slice(0, 8) // max ddmmyyyy

    let day = digits.slice(0, 2)
    let month = digits.slice(2, 4)
    let year = digits.slice(4, 8)

    let error = ''

    // ---- Day validation ----
    if (day.length === 2 && parseInt(day) > 31) {
      day = '31'
      error = 'Day cannot be greater than 31'
    }

    // ---- Month validation ----
    if (month.length === 2 && parseInt(month) > 12) {
      month = '12'
      error = 'Month cannot be greater than 12'
    }

    // ---- Build formatted value progressively ----
    let formatted = day
    if (digits.length > 2) formatted += '/'
    if (month) formatted += month
    if (digits.length > 4) formatted += '/'
    if (year) formatted += year

    return { formatted, error }
  }

  async function fetchCities() {
    try {
      const res = await fetch(`${wifiUrl}/api/customer/cities`, { cache: 'no-store' })

      if (!res.ok) throw new Error('Server error')

      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        const formattedCities = json.data.map((city) => ({
          label: city,
          value: city,
        }))

        setCityOptions(formattedCities)
      }
    } catch (err) {
      console.log('City fetch error:', err)
      showCustomToast('⚠️ Unable to fetch city list. Check your internet.', 'error')
    }
  }

  const hasFetchedRef = React.useRef(false)

  if (!hasFetchedRef.current) {
    const navEntry = performance.getEntriesByType('navigation')[0]

    if (navEntry?.type === 'reload') {
      fetchCities()
    }

    hasFetchedRef.current = true
  }

  function isValidDDMMYYYY(dateStr) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false

    const [dd, mm, yyyy] = dateStr.split('/').map(Number)

    // basic bounds
    if (yyyy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return false

    // days per month
    const daysInMonth = new Date(yyyy, mm, 0).getDate()

    return dd <= daysInMonth
  }

  function isValidLastVisitDate(dateStr) {
    if (!isValidDDMMYYYY(dateStr)) return false

    const [dd, mm, yyyy] = dateStr.split('/').map(Number)
    const visitDate = new Date(yyyy, mm - 1, dd)

    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    if (visitDate > today) return false
    if (visitDate < oneYearAgo) return false

    return true
  }

  console.log(form.otherServiceName)

  function validate() {
    const e = {}

    // if (!form.fullName) e.fullName = 'Full name is required'
    if (!form.fullName) {
      e.fullName = 'Full name is required'
    } else if (!isValidAadhaarName(form.fullName)) {
      e.fullName = 'Name must match Aadhaar (alphabets only)'
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      e.mobile = 'Enter a valid 10-digit mobile number'
    } else if (!/^[6-9]/.test(form.mobile)) {
      e.mobile = 'Mobile number must start with 6, 7, 8, or 9'
    }

    // 🔴 Referral Code (MANDATORY)
    // if (!form.referralCode || !form.referralCode.trim()) {
    //   e.referralCode = 'Referral code is required'
    // } else
    //    if (!/^[A-Z0-9]{4,10}$/.test(form.referralCode)) {
    //   e.referralCode = 'Invalid referral code'
    // }

    // // 🟡 Refer By (OPTIONAL)
    // if (form.referBy && !isValidAadhaarName(form.referBy)) {
    //   e.referBy = 'Refer by name must contain only alphabets'
    // }

    // if (!form.city) e.city = 'City is required'

    if (!form.city) {
      e.city = 'City is required'
    } else if (form.city === 'other') {
      if (!form.otherCity || !form.otherCity.trim()) {
        e.otherCity = 'Please enter your city name'
      } else if (!isValidAadhaarName(form.otherCity)) {
        e.otherCity = 'City name only alphabets allowed'
      }
    }

    if (!form.address || !isValidAddress(form.address)) {
      e.address = 'Please enter complete address'
    }

    if (!/^\d{12}$/.test(form.Aadhar)) e.Aadhar = 'Enter a valid 12-digit Aadhaar number'

    if (!form.dob) {
      e.dob = 'Date of birth is required'
    } else if (!isValidDOB(form.dob)) {
      e.dob = 'Enter valid DOB (dd/mm/yyyy) and must be 18+'
    }

    if (!form.gender) e.gender = 'gender required'
    // else if (calculateAge(form.dob) < 18) e.dob = 'Must be at least 18 years old'

    if (form.serviceStatus == '1') {
      // if (!form.clinicName) e.clinicName = 'Clinic name required'
      if (!form.clinicName) {
        e.clinicName = 'Clinic name is required'
      } else if (!isValidAlphaNumericName(form.clinicName)) {
        e.clinicName = 'Clinic name must contain alphabets (numbers allowed)'
      }
      if (!/^\d{6}$/.test(form.clinicCityArea)) {
        e.clinicCityArea = 'Pincode must be exactly 6 digits.'
      }

      if (!form.dateOfLastVisit) e.dateOfLastVisit = 'Last visit date required'
      else {
        const selected = new Date(form.dateOfLastVisit)
        const max = new Date(maxToday)
        const min = new Date(minDate12Months)

        if (!form.dateOfLastVisit) {
          e.dateOfLastVisit = 'Last visit date is required'
        } else if (!isValidLastVisitDate(form.dateOfLastVisit)) {
          e.dateOfLastVisit = 'Date must be within the last 1 year (dd/mm/yyyy)'
        }
      }

      // if (!form.serviceType) e.serviceType = 'Service required'
      if (!form.serviceType || form.serviceType.length === 0) e.serviceType = 'Service required'
      if (form.serviceType.includes('other')) {
        if (!form.otherServiceName || !form.otherServiceName.trim()) {
          e.otherServiceName = 'Please specify the service'
        } else if (!isOnlyAlphabetsWithSpecialChars(form.otherServiceName)) {
          e.otherServiceName = 'Service name must contain only alphabets'
        }
      }

      if (!form.prescription)
        e.prescription = 'Please upload your receipt (PDF, JPG, JPEG, or PNG).'
    }
    // ✔ INTERESTED FLOW – Validate interest info
    if (form.serviceStatus === '2') {
      if (!form.interestCategory) {
        e.interestCategory = 'Please select a category'
      }
      //  else if (form.interestCategory === 'Other' && !form.otherInterestCategory.trim()) {
      //   e.otherInterestCategory = 'Please specify the category'
      // }
      else if (form.interestCategory === 'Other') {
        if (!form.otherInterestCategory || !form.otherInterestCategory.trim()) {
          e.otherInterestCategory = 'Please specify the category'
        } else if (!isOnlyAlphabetsWithSpecialChars(form.otherInterestCategory)) {
          e.otherInterestCategory = 'Category must contain only alphabets'
        }
      }

      if (!form.problemDescription || form.problemDescription.length === 0)
        e.problemDescription = 'Please select at least one concern'

      // if (form.problemDescription.includes('other') && !form.otherServiceName.trim()) {
      //   e.otherServiceName = 'Please specify your concern'
      // }

      if (form.problemDescription.includes('other')) {
        if (!form.otherServiceName || !form.otherServiceName.trim()) {
          e.otherServiceName = 'Please specify your concern'
        } else if (!isOnlyAlphabetsWithSpecialChars(form.otherServiceName)) {
          e.otherServiceName = 'Service name must contain only alphabets'
        }
      }

      if (!form.skinTone) e.skinTone = 'Please select your skin tone'
    }

    if (!form.aadhaarConsent)
      e.aadhaarConsent = 'You must accept Aadhaar consent before submitting.'

    if (!form.userConsent) e.userConsent = 'You must agree to the User Consent Disclaimer.'

    setErrors(e)
    // scrollToFirstError(e)
    return { valid: Object.keys(e).length === 0, errorObj: e }
  }

  const inputRefs = {
    fullName: React.useRef(null),
    mobile: React.useRef(null),
    Aadhar: React.useRef(null),
    dob: React.useRef(null),
    city: React.useRef(null),
    cityOther: React.useRef(null),
    clinicName: React.useRef(null),
    clinicCityArea: React.useRef(null),
    dateOfLastVisit: React.useRef(null),
    serviceType: React.useRef(null),
    interestCategory: React.useRef(null),
    problemDescription: React.useRef(null),
    skinTone: React.useRef(null),
    gender: React.useRef(null),
    skinToneOther: React.useRef(null),
    prescription: React.useRef(null),
    otherServiceName: React.useRef(null),
    otherCity: React.useRef(null),
  }

  function ddmmyyyyToIso(dateStr) {
    if (!dateStr) return null
    const [dd, mm, yyyy] = dateStr.split('/')
    return `${yyyy}-${mm}-${dd}` // yyyy-MM-dd
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // 1️⃣ Check serviceStatus explicitly
    if (!form.serviceStatus) {
      setServiceStatusError('Please choose Yes or No before submitting.')
      return
    } else {
      setServiceStatusError('')
    }

    const { valid, errorObj } = validate()
    if (!valid) {
      scrollToFirstError(errorObj)
      return
    }

    const payload = {
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email,
      city: form.city === 'other' ? form.otherCity : form.city,
      dob: ddmmyyyyToIso(form.dob),
      clinicName: form.clinicName,
      clinicCityArea: form.clinicCityArea,
      dateOfLastVisit: ddmmyyyyToIso(form.dateOfLastVisit),
      serviceType: form.serviceType.map((s) => (s === 'other' ? form.otherServiceName : s)),
      blood: form.blood,
      // registrationCode: form.registraionCode || sessionStorage.getItem('registraionCode'),
      referId: form.referralCode, // ✅ mandatory
      // referBy: form.referBy || null,
      aadharNumber: form.Aadhar,
      prescription: form.prescription, // File or text
      // referBy: form.referBy,
      gender: form.gender,
      serviceStatus: form.serviceStatus,
      concern: form.problemDescription.map((item) =>
        item === 'other' ? form.otherServiceName : item,
      ),
      category:
        form.interestCategory === 'Other' ? form.otherInterestCategory : form.interestCategory,
      skinTone: form.skinTone === 'other' ? form.skinToneOther : form.skinTone,
      photo: form.samplePhoto,
      aadhaarConsent: form.aadhaarConsent,
      userConsent: form.userConsent,
      privacyConsent: form.privacyConsent,
      address: form.address,
    }

    console.log(form)
    console.log(
      form.problemDescription.map((item) => (item === 'other' ? form.otherServiceName : item)),
    )

    setLoading(true)
    try {
      const result = await registerCustomerRf(payload)
      console.log(result)
      const newErrors = { ...errors }
      if (!result.success) {
        const backendMessage = result.message || 'Something went wrong'
        if (backendMessage.toLowerCase().includes('mobile')) {
          newErrors.mobile = backendMessage
        } else if (backendMessage.toLowerCase().includes('aadhaar')) {
          newErrors.Aadhar = backendMessage
        }
        setErrors(newErrors)
        scrollToFirstError(newErrors)
        showCustomToast(`${result.message}` || '❌ Registration failed!', 'error')
        return
      } else {
        showCustomToast(`${result.message}` || `Some filed not filled`, 'success')
      }
      setSubmitted(true)
      const data = result.data
      console.log('Customer Registered ID:', data)
      
      setUserData(data)
      setShowWheel(true)
   navigate('/onboard-success', {
  state: {
    name: form.fullName,
    data: form,
    isregister: false,
  },
})

    } catch (error) {
      console.error('Registration Error:', error)
      showCustomToast('⚠️ Something went wrong! Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceStatusSelect = (status) => {
    let missing = []

    if (!form.userConsent) missing.push('User Consent Disclaimer')
    if (!form.privacyConsent) missing.push('Privacy Policy')
    if (!form.aadhaarConsent) missing.push('Aadhaar Consent')

    if (missing.length > 0) {
      setServiceStatusError(`Please agree to: ${missing.join(', ')}.`)
      return
    }

    setServiceStatusError('') // ⭐ Clear when no missing consents
    setForm((prev) => ({
      ...prev,
      serviceStatus: status,
    }))

    setTimeout(() => {
      if (serviceStatusRef.current) {
        serviceStatusRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 200)
  }

  function isValidDOB(dobStr) {
    if (!isValidDDMMYYYY(dobStr)) return false

    const [dd, mm, yyyy] = dobStr.split('/').map(Number)
    const dob = new Date(yyyy, mm - 1, dd)

    const today = new Date()
    let age = today.getFullYear() - yyyy
    const m = today.getMonth() - (mm - 1)

    if (m < 0 || (m === 0 && today.getDate() < dd)) age--

    return age >= 18
  }

  function cleanUserData(data) {
    if (!data) return null

    const { prescription, samplePhoto, prizePostScreenshot, followScreenshot, ...rest } = data

    return rest
  }

  const scrollToFirstError = (errorsObject) => {
    const firstErrorField = Object.keys(errorsObject).find((key) => errorsObject[key])

    if (!firstErrorField) return

    const fieldRef = inputRefs[firstErrorField]?.current
    const container = document.querySelector('.form-panel')

    if (fieldRef && container) {
      const fieldTop =
        fieldRef.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop

      container.scrollTo({
        top: fieldTop - 120,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div
      className="d-flex justify-content-center   w-100 bg"
      style={{
        minHeight: '100vh',

        overflow: 'hidden',
      }}
    >
      <div
        className="d-flex bgCard"
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* LEFT IMAGE */}

        <div
          className="d-none d-md-block left-image  "
          style={{
            width: '45%',
            backgroundImage: `url(${bgLogo})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center ',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {' '}
          <img
            src={DermaCareLogo}
            alt="logo"
            style={{
              height: 100,
              borderRadius: 12,
              objectFit: 'fill',
              // border: '1px solid #eee',
            }}
          />
        </div>

        {/* RIGHT PANEL SCROLL */}
        <div
          className="thin-scroll form-panel"
          style={{
            width: '55%',
            height: '100%',
            overflowY: 'auto',
            padding: '40px 30px',
          }}
        >
          {/* HEADER */}

          {/* SUCCESS MESSAGE */}
          <div>
            <CForm onSubmit={handleSubmit}>
              <>
                {/* <h4 className="m-0 fw-bold text-center w-100 gradient-text"></h4> */}
                <div className="header-container justify-content-center align-items-center d-flex flex-column">
                  <img
                    src={DermaCareLogo}
                    alt="logo"
                    style={{
                      height: 100,
                      borderRadius: 12,
                      objectFit: 'fill',
                      // border: '1px solid #eee',
                    }}
                  />

                  <h4 className="m-0 fw-bold text-center w-100 gradient-text">Registration</h4>
                </div>

                <CRow className="g-4 mt-4">
                  {/* Full Name + Mobile */}
                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient "
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Full Name (As Per Aadhaar Card) <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      ref={inputRefs.fullName}
                      name="fullName"
                      placeholder="Enter Full Name (as per Aadhaar)"
                      value={form.fullName}
                      onChange={(e) => {
                        let value = e.target.value

                        // ❌ Block numbers & special characters (allow dot also)
                        if (!/^[A-Za-z. ]*$/.test(value)) return

                        // 🔹 Remove extra spaces
                        value = value.replace(/\s+/g, ' ').trimStart()

                        // 🔹 Check FULL uppercase
                        const isAllUpperCase = value && value === value.toUpperCase()

                        if (!isAllUpperCase) {
                          value = value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
                        }

                        // ✅ Update form
                        setForm((prev) => ({
                          ...prev,
                          fullName: value,
                        }))

                        // ✅ Clear error when valid
                        if (isValidAadhaarName(value)) {
                          setErrors((prev) => ({
                            ...prev,
                            fullName: null,
                          }))
                        }
                      }}
                    />

                    {errors.fullName && (
                      <p
                        style={{
                          color: 'red',
                        }}
                      >
                        {errors.fullName}
                      </p>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient  "
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Mobile Number <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      ref={inputRefs.mobile}
                      name="mobile"
                      placeholder="Enter Mobile Number"
                      maxLength={10}
                      inputMode="numeric"
                      value={form.mobile}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '') // only digits

                        if (value.length > 10) value = value.slice(0, 10)

                        handleChange({ target: { name: 'mobile', value } })

                        // live validation
                        if (value.length > 0 && !/^[6-9]/.test(value)) {
                          setErrors((prev) => ({
                            ...prev,
                            mobile: 'Mobile number must start with 6, 7, 8, or 9',
                          }))
                        } else if (value.length > 0 && value.length < 10) {
                          setErrors((prev) => ({
                            ...prev,
                            mobile: 'Mobile number must be 10 digits',
                          }))
                        } else {
                          setErrors((prev) => ({ ...prev, mobile: null }))
                        }
                      }}
                    />

                    {errors.mobile && (
                      <p
                        style={{
                          color: 'red',
                        }}
                      >
                        {errors.mobile}
                      </p>
                    )}
                  </CCol>

                  {/* DOB + City */}

                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient "
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Gender <span className="text-danger">*</span>
                    </CFormLabel>
                    <div ref={inputRefs.gender}>
                      <CFormSelect name="gender" value={form.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Others">Others</option>
                      </CFormSelect>
                    </div>
                    {errors.gender && <p style={{ color: 'red' }}>{errors.gender}</p>}
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient"
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Date of Birth <span className="text-danger">*</span>
                    </CFormLabel>
                    <div ref={inputRefs.dob}>
                      <CInputGroup>
                        <CFormInput
                          type="text"
                          placeholder="dd/mm/yyyy"
                          value={form.dob}
                          maxLength={10}
                          inputMode="numeric"
                          onChange={(e) => {
                            const { formatted, error } = formatAndValidateDateInput(e.target.value)

                            setForm((prev) => ({ ...prev, dob: formatted }))
                            setErrors((prev) => ({ ...prev, dob: error || null }))
                          }}
                        />

                        <CInputGroupText
                          style={{
                            backgroundColor: '#f3f3f3',
                            cursor: 'not-allowed',
                          }}
                          title="Enter DOB manually (18+)"
                        >
                          <CIcon icon={cilCalendar} style={{ color: '#999' }} />
                        </CInputGroupText>
                      </CInputGroup>
                    </div>
                    {errors.dob && <p style={{ color: 'red' }}>{errors.dob}</p>}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient"
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      City <span className="text-danger">*</span>
                    </CFormLabel>
                    <div ref={inputRefs.city}>
                      <Select
                        placeholder="Select or Search City"
                        isSearchable
                        value={form.city ? { label: form.city, value: form.city } : null}
                        onChange={(selected) => {
                          setForm((prev) => ({
                            ...prev,
                            city: selected?.value || '',
                            otherCity: '',
                          }))
                          setErrors((prev) => ({ ...prev, city: null }))
                        }}
                        options={[...cityOptions, { label: 'Other', value: 'other' }]}
                        styles={selectStyles}
                      />

                      {form.city === 'other' && (
                        <CFormInput
                          className="mt-2"
                          placeholder="Enter your city / town / village"
                          value={form.otherCity}
                          ref={inputRefs.otherCity}
                          onChange={(e) => {
                            const value = e.target.value

                            setForm((prev) => ({ ...prev, otherCity: value }))

                            // ✅ clear error when user types
                            if (value.trim()) {
                              setErrors((prev) => ({ ...prev, otherCity: null }))
                            }
                          }}
                        />
                      )}
                    </div>

                    {errors.city && <p style={{ color: 'red' }}>{errors.city}</p>}
                    {errors.otherCity && <p style={{ color: 'red' }}>{errors.otherCity}</p>}
                  </CCol>

                  {/* {errors.city && <p style={{ color: '#ff2e85' }}>{errors.city}</p>} */}
                  <CCol md={6}>
                    <RefferalCodeAddress form={form} setForm={setForm} error={errors.address} />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient"
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Referral Code (Optional)  
                    </CFormLabel>

                    <CFormInput
                      placeholder="Enter referral code"
                      value={form.referralCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().trim()
                        setForm((prev) => ({ ...prev, referralCode: value }))
                        // setErrors((prev) => ({ ...prev, referralCode: null }))
                      }}
                    />

                    {/* {errors.referralCode && (
                      <p style={{ color: 'red', fontSize: 13 }}>{errors.referralCode}</p>
                    )} */}
                  </CCol>
                  {/* <CCol md={6}>
                    <CFormLabel
                      className="label-gradient"
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Refer By <span className="text-muted">(Optional)</span>
                    </CFormLabel>

                    <CFormInput
                      placeholder="Enter referrer name (optional)"
                      value={form.referBy}
                      onChange={(e) => {
                        const value = e.target.value
                        setForm((prev) => ({ ...prev, referBy: value }))
                        setErrors((prev) => ({ ...prev, referBy: null }))
                      }}
                    />

                    {errors.referBy && (
                      <p style={{ color: 'red', fontSize: 13 }}>{errors.referBy}</p>
                    )}
                  </CCol> */}
                  <CCol md={6}>
                    <CFormLabel
                      className="label-gradient "
                      style={{ color: NGK_COLORS.primarySoft }}
                    >
                      Aadhaar Card Number <span className="text-danger">*</span>
                    </CFormLabel>

                    <div
                      className="d-flex align-items-center"
                      style={{ gap: '10px' }}
                      ref={inputRefs.Aadhar}
                    >
                      <CFormInput
                        name="Aadhar"
                        inputMode="numeric"
                        maxLength={12}
                        value={form.Aadhar}
                        placeholder="Enter 12-digit Aadhaar number"
                        onFocus={() => {
                          if (!form.aadhaarConsent) {
                            showCustomToast(
                              '⚠️ Please accept Aadhaar consent before entering Aadhaar number',
                              'error',
                            )

                            // highlight consent section
                            setHighlightAadhaarConsent(true)

                            // remove highlight after 2 seconds
                            setTimeout(() => setHighlightAadhaarConsent(false), 2000)

                            // move user to consent section
                            inputRefs.aadhaarConsent?.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            })
                          }
                        }}
                        onChange={(e) => {
                          if (!form.aadhaarConsent) return // ❌ block typing

                          const value = e.target.value.replace(/\D/g, '')
                          handleChange({ target: { name: 'Aadhar', value } })

                          if (value.length === 12) {
                            setErrors((prev) => ({ ...prev, Aadhar: null }))
                            setAadharVerified(true)
                          } else {
                            setAadharVerified(false)
                            if (value.length > 0 && value.length < 12) {
                              setErrors((prev) => ({
                                ...prev,
                                Aadhar: 'Aadhaar must be exactly 12 digits',
                              }))
                            } else {
                              setErrors((prev) => ({ ...prev, Aadhar: null }))
                            }
                          }
                        }}
                        disabled={!form.aadhaarConsent}
                      />
                    </div>
                    {!form.aadhaarConsent && (
                      <p style={{ color: '#ff2e85', fontSize: '12px' }}>
                        Please accept Aadhaar consent to enable this field
                      </p>
                    )}

                    {errors.Aadhar && (
                      <p
                        style={{
                          color: 'red',
                        }}
                      >
                        {errors.Aadhar}
                      </p>
                    )}

                    {/* Error */}
                  </CCol>

                  <CCol md={12} style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={form.userConsent}
                        disabled={form.userConsent}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            userConsent: e.target.checked,
                          }))

                          if (e.target.checked) {
                            setErrors((prev) => ({ ...prev, userConsent: '' }))
                            setServiceStatusError('')
                          }
                        }}
                        style={{
                          width: '15px',
                          height: '15px',
                          accentColor: NGK_COLORS.primary, // Checkbox color
                          cursor: 'pointer',
                          marginTop: '3px',
                        }}
                      />

                      {/* Text with clickable link */}
                      <div style={{ fontSize: '16px', color: '#555' }}>
                        I agree to the{' '}
                        <span
                          style={{
                            color: NGK_COLORS.primary,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          onClick={() => setShowConsentModal(true)}
                        >
                          User Consent Disclaimer
                        </span>
                        .
                      </div>
                    </div>

                    {/* Error */}
                    {errors.userConsent && (
                      <p style={{ color: NGK_COLORS.primary, marginTop: '5px' }}>
                        {errors.userConsent}
                      </p>
                    )}
                  </CCol>

                  <div
                    className="d-flex align-items-start  "
                    style={{ gap: '10px', marginTop: '10px' }}
                  >
                    <input
                      type="checkbox"
                      checked={form.privacyConsent}
                      disabled={form.privacyConsent}
                      onChange={(e) => {
                        // setForm({ ...form, privacyConsent: e.target.checked })
                        setForm((prev) => ({ ...prev, privacyConsent: e.target.checked }))

                        if (e.target.checked) {
                          setErrors((prev) => ({ ...prev, privacyConsent: '' }))
                          setServiceStatusError('')
                        }
                      }}
                      style={{
                        width: '15px',
                        height: '15px',
                        accentColor: NGK_COLORS.primary, // Checkbox color
                        cursor: 'pointer',
                        marginTop: '3px',
                      }}
                    />

                    <label style={{ fontSize: '16px', color: '#555', cursor: 'pointer' }}>
                      I have read and understood{' '}
                      <a
                        href="/pdf/privacy-policy.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: NGK_COLORS.primary,
                          textDecoration: 'underline',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Error Message */}
                  {errors.privacyConsent && (
                    <p style={{ color: '#ff2e85', fontSize: '13px', marginLeft: '28px' }}>
                      {errors.privacyConsent}
                    </p>
                  )}

                  <CCol md={12}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={form.aadhaarConsent}
                          disabled={form.aadhaarConsent}
                          style={{
                            width: '15px',
                            height: '15px',
                            accentColor: NGK_COLORS.primary, // Checkbox color
                            cursor: 'pointer',
                            marginTop: '3px',
                            backgroundColor: highlightAadhaarConsent ? '#fff3f6' : 'transparent',
                            borderRadius: '10px',
                            padding: highlightAadhaarConsent ? '10px' : '0',
                            transition: 'all 0.3s ease',
                          }}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, aadhaarConsent: e.target.checked }))
                            // setForm({ ...form, aadhaarConsent: e.target.checked })

                            // remove error when checked
                            if (e.target.checked) {
                              setErrors((prev) => ({ ...prev, aadhaarConsent: '' }))
                              setServiceStatusError('')
                            }
                          }}
                        />

                        <div style={{ fontSize: '15px', color: '#555' }}>
                          <strong>Aadhaar Consent:</strong>
                          <p style={{ marginTop: '6px' }} className="text-muted">
                            <strong>{form.fullName}</strong>, I hereby give explicit and voluntary
                            consent to <strong>Udit CosmeTech Private Limited</strong> to collect
                            and securely process my Aadhaar number for identity verification and
                            duplicate-account prevention purposes on Neeha’s Glow Kart. I have read
                            and understood the{' '}
                            <span
                              className="aadhaar-link"
                              onClick={() => setShowAadhaarModal(true)}
                            >
                              Aadhaar Consent Notice.
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* ERROR MESSAGE */}
                      {errors.aadhaarConsent && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                          {errors.aadhaarConsent}
                        </p>
                      )}
                    </div>
                  </CCol>
                  {serviceStatusError && (
                    <p style={{ color: 'red', marginTop: '5px', fontSize: '14px' }}>
                      {serviceStatusError}
                    </p>
                  )}

                  {/* Consent */}
                  <CCol md={12} ref={serviceStatusRef}>
                    <div className="d-flex justify-content-between">
                      <CFormLabel>
                        Have you taken any dermatology related service [Botox, PRP, Laser, etc...]
                        in the last 12 months?
                      </CFormLabel>
                    </div>

                    <div
                      style={{ display: 'flex', gap: '20px' }}
                      className="d-flex justify-content-center"
                    >
                      <CButton
                        type="button"
                        style={{
                          backgroundColor:
                            form.serviceStatus === '1' ? NGK_COLORS.primary : '#e4e4e4',
                          color: form.serviceStatus === '1' ? '#fff' : '#444',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          transition: '0.25s',
                        }}
                        onClick={() => handleServiceStatusSelect('1')}
                      >
                        Yes
                      </CButton>

                      <CButton
                        type="button"
                        style={{
                          backgroundColor:
                            form.serviceStatus === '2' ? NGK_COLORS.primary : '#e4e4e4',
                          color: form.serviceStatus === '2' ? '#fff' : '#444',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          transition: '0.25s',
                        }}
                        onClick={() => handleServiceStatusSelect('2')}
                      >
                        No, I'm Interested
                      </CButton>
                    </div>
                  </CCol>

                  {/* Conditional fields */}
                  {form.serviceStatus === '1' && (
                    <>
                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Clinic Name <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          ref={inputRefs.clinicName}
                          name="clinicName"
                          placeholder="Enter Clinic Name"
                          value={form.clinicName}
                          onChange={handleChange}
                        />
                        {errors.clinicName && (
                          <p
                            style={{
                              color: 'red',
                            }}
                          >
                            {errors.clinicName}
                          </p>
                        )}
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Clinic Area Pincode <span className="text-danger">*</span>
                        </CFormLabel>

                        <CFormInput
                          ref={inputRefs.clinicCityArea}
                          name="clinicCityArea"
                          placeholder="Enter 6-digit pincode"
                          value={form.clinicCityArea}
                          maxLength={6}
                          inputMode="numeric"
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '') // allow only digits
                            if (value.length > 6) value = value.slice(0, 6) // max 6 digits
                            handleChange({ target: { name: 'clinicCityArea', value } })
                          }}
                        />

                        {errors.clinicCityArea && (
                          <p style={{ color: 'red' }}>{errors.clinicCityArea}</p>
                        )}
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Last Visit Date <span className="text-danger">*</span>
                        </CFormLabel>

                        <div ref={inputRefs.dateOfLastVisit}>
                          <CInputGroup>
                            <CFormInput
                              type="text"
                              placeholder="dd/mm/yyyy"
                              value={form.dateOfLastVisit}
                              maxLength={10}
                              inputMode="numeric"
                              onChange={(e) => {
                                const { formatted, error } = formatAndValidateDateInput(
                                  e.target.value,
                                )

                                setForm((prev) => ({ ...prev, dateOfLastVisit: formatted }))
                                setErrors((prev) => ({
                                  ...prev,
                                  dateOfLastVisit: error || null,
                                }))
                              }}
                            />

                            {/* 📅 Suffix icon (disabled UI only) */}

                            <CInputGroupText
                              style={{
                                backgroundColor: '#f3f3f3',
                                cursor: 'not-allowed',
                              }}
                              title="Enter date manually (within last 1 year)"
                            >
                              <CIcon icon={cilCalendar} style={{ color: '#999' }} />
                            </CInputGroupText>
                          </CInputGroup>
                        </div>

                        {errors.dateOfLastVisit && (
                          <p style={{ color: 'red' }}>{errors.dateOfLastVisit}</p>
                        )}
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Service Availed <span className="text-danger">*</span>
                        </CFormLabel>

                        <div ref={inputRefs.serviceType}>
                          <Select
                            options={procedureOptions}
                            isMulti
                            placeholder="Select services received..."
                            onChange={handleProcedureChange}
                            styles={selectStyles}
                            value={procedureOptions.filter(
                              (opt) =>
                                form.serviceType?.includes(opt.label) || // actual label
                                (opt.value === 'other' && form.serviceType.includes('other')),
                            )}
                          />
                        </div>

                        {errors.serviceType && (
                          <p
                            style={{
                              color: 'red',
                            }}
                          >
                            {errors.serviceType}
                          </p>
                        )}
                        {/* Other input */}
                        {showOtherInput && (
                          <div style={{ marginTop: 10 }}>
                            <CFormInput
                              ref={inputRefs.otherServiceName}
                              placeholder="Enter Service Name"
                              value={form.otherServiceName || ''}
                              onChange={(e) => {
                                let value = e.target.value

                                // ❌ Block numbers only
                                if (/\d/.test(value)) return

                                // Remove extra spaces
                                value = value.replace(/\s+/g, ' ').trimStart()

                                setForm((prev) => ({
                                  ...prev,
                                  otherServiceName: value,
                                }))

                                if (isOnlyAlphabetsWithSpecialChars(value)) {
                                  setErrors((prev) => ({ ...prev, otherServiceName: null }))
                                }
                              }}
                            />
                          </div>
                        )}
                        {errors.otherServiceName && (
                          <p
                            style={{
                              color: 'red',
                            }}
                          >
                            {errors.otherServiceName}
                          </p>
                        )}
                      </CCol>
                      <div>
                        <CFormLabel
                          className="label-gradient "
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Upload your last visit receipt <span className="text-danger">*</span>
                        </CFormLabel>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <label
                            style={{
                              border: `2px dashed ${NGK_COLORS.primaryLight}`,
                              borderRadius: 12,
                              padding: '18px',
                              width: '100%',
                              textAlign: 'center',
                              display: 'block',
                              cursor: 'pointer',
                              // background: NGK_COLORS.primarySoft,
                              color: NGK_COLORS.primary,
                              fontWeight: '500',
                              fontSize: 15,
                            }}
                          >
                            📁 Tap to upload receipt
                            <input
                              type="file"
                              accept="image/*, application/pdf"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (!file) return

                                try {
                                  const base64 = await processFile(file)
                                  updateForm('prescription', base64)
                                  setErrors((prev) => ({ ...prev, prescription: null }))
                                } catch (err) {
                                  alert(err.message)
                                  e.target.value = ''
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <UploadedPreview src={form.prescription} />
                        </div>
                      </div>
                      <small style={{ color: '#888', display: 'block' }}>
                        Accepted formats: PDF, JPG, JPEG, PNG
                      </small>

                      {errors.prescription && (
                        <div
                          style={{
                            color: 'red',
                          }}
                        >
                          {errors.prescription}
                        </div>
                      )}
                    </>
                  )}

                  {form.serviceStatus === '2' && (
                    <>
                      {/* Category Dropdown */}
                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Select Category <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormSelect
                          name="interestCategory"
                          value={form.interestCategory}
                          onChange={(e) => {
                            handleChange(e)

                            // reset custom input when switching away from Other
                            if (e.target.value !== 'Other') {
                              setForm((prev) => ({
                                ...prev,
                                otherInterestCategory: '',
                              }))
                            }
                          }}
                        >
                          <option value="">Select...</option>
                          <option value="Skin">Skin</option>
                          <option value="Hair">Hair</option>
                          <option value="Laser">Laser</option>
                          <option value="Body">Body</option>
                          <option value="Other">Others</option>
                        </CFormSelect>

                        {errors.interestCategory && (
                          <p
                            style={{
                              color: 'red',
                            }}
                          >
                            {errors.interestCategory}
                          </p>
                        )}
                        {form.interestCategory === 'Other' && (
                          <div className="mt-2">
                            <CFormInput
                              ref={inputRefs.otherInterestCategory}
                              placeholder="Please specify category"
                              value={form.otherInterestCategory}
                              onChange={(e) => {
                                let value = e.target.value

                                // ❌ Block numbers only
                                if (/\d/.test(value)) return

                                // Remove extra spaces
                                value = value.replace(/\s+/g, ' ').trimStart()

                                setForm((prev) => ({
                                  ...prev,
                                  otherInterestCategory: value,
                                }))

                                if (isOnlyAlphabetsWithSpecialChars(value)) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    otherInterestCategory: null,
                                  }))
                                }
                              }}
                            />
                            {/* onChange={(e) => {
                                    setForm((prev) => ({
                                      ...prev,
                                      otherInterestCategory: e.target.value,
                                    }))
                                    setErrors((prev) => ({ ...prev, otherInterestCategory: null }))
                                  }} */}
                            {/* /> */}
                          </div>
                        )}

                        {errors.otherInterestCategory && (
                          <p style={{ color: 'red' }}>{errors.otherInterestCategory}</p>
                        )}
                      </CCol>

                      {/* Problem or Procedure */}
                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Your Concern / Procedure <span className="text-danger">*</span>
                        </CFormLabel>

                        <div ref={inputRefs.problemDescription}>
                          <Select
                            options={[
                              // remove any existing "Others" by checking label
                              ...procedureOptions.filter(
                                (op) => op.label.toLowerCase() !== 'others',
                              ),
                              { value: 'other', label: 'Others' }, // add one clean version
                            ]}
                            isMulti
                            placeholder="Your concerns/procedures..."
                            value={[
                              ...procedureOptions.filter((opt) =>
                                form.problemDescription?.includes(opt.label),
                              ),
                              ...(form.problemDescription?.includes('other')
                                ? [{ value: 'other', label: 'Others' }]
                                : []),
                            ]}
                            onChange={(selected) => {
                              const labels = selected.map((item) =>
                                item.value === 'other' ? 'other' : item.label,
                              )

                              setForm((prev) => ({ ...prev, problemDescription: labels }))
                              setErrors((prev) => ({ ...prev, problemDescription: '' }))
                            }}
                            styles={selectStyles}
                          />
                        </div>

                        {errors.problemDescription && (
                          <p style={{ color: 'red' }}>{errors.problemDescription}</p>
                        )}

                        {/* Show Other input */}
                        {form.problemDescription?.includes('other') && (
                          <div style={{ marginTop: 10 }}>
                            {/* <CFormLabel
                                  className="label-gradient"
                                  style={{ color: NGK_COLORS.primarySoft }}
                                >
                                  Specify Other Concern
                                </CFormLabel> */}
                            <CFormInput
                              ref={inputRefs.otherServiceName}
                              placeholder="Enter your concern"
                              value={form.otherServiceName}
                              onChange={(e) => {
                                let value = e.target.value

                                // ❌ Block numbers only
                                if (/\d/.test(value)) return

                                // Remove extra spaces
                                value = value.replace(/\s+/g, ' ').trimStart()

                                setForm((prev) => ({
                                  ...prev,
                                  otherServiceName: value,
                                }))

                                if (isOnlyAlphabetsWithSpecialChars(value)) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    otherServiceName: null,
                                  }))
                                }
                              }}
                            />
                          </div>
                        )}
                        {errors.otherServiceName && (
                          <p style={{ color: 'red' }}>{errors.otherServiceName}</p>
                        )}
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient"
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Your Skin Tone <span className="text-danger">*</span>
                        </CFormLabel>

                        <CFormSelect
                          name="skinTone"
                          value={form.skinTone}
                          onChange={(e) => {
                            const value = e.target.value
                            handleChange(e)

                            // If user selects "other", open input box & clear old value
                            if (value === 'other') {
                              setForm((prev) => ({ ...prev, skinToneOther: '' }))
                            }
                          }}
                        >
                          <option value="">Select Skin Tone</option>
                          {indianSkinTones.map((tone) => (
                            <option key={tone.value} value={tone.value}>
                              {tone.label}
                            </option>
                          ))}
                        </CFormSelect>

                        {errors.skinTone && <p style={{ color: 'red' }}>{errors.skinTone}</p>}

                        {/* Show input only when "other" is selected */}
                        {form.skinTone === 'other' && (
                          <div style={{ marginTop: 10 }}>
                            <CFormLabel
                              className="label-gradient  "
                              style={{ color: NGK_COLORS.primarySoft }}
                            >
                              Specify Other Skin Tone
                            </CFormLabel>

                            <CFormInput
                              ref={inputRefs.skinToneOther}
                              placeholder="Enter your skin tone"
                              value={form.skinToneOther || ''}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, skinToneOther: e.target.value }))
                              }
                            />
                          </div>
                        )}
                        {errors.skinToneOther && (
                          <p style={{ color: 'red' }}>{errors.skinToneOther}</p>
                        )}
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel
                          className="label-gradient  "
                          style={{ color: NGK_COLORS.primarySoft }}
                        >
                          Upload Photo (Optional)
                        </CFormLabel>
                        <div
                          md={6}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <label
                            style={{
                              border: '2px dashed #ff95c9',
                              borderRadius: 12,
                              padding: '18px',
                              width: '100%',
                              textAlign: 'center',
                              display: 'block',
                              cursor: 'pointer',
                              background: '#fff8fc',
                              color: '#ff2e85',
                              fontWeight: '500',
                              fontSize: 15,
                            }}
                          >
                            📁 Upload Photo
                            <input
                              type="file"
                              accept="image/*, application/pdf"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (!file) return

                                try {
                                  const base64 = await processFile(file)
                                  updateForm('samplePhoto', base64)
                                  setErrors((prev) => ({ ...prev, samplePhoto: null }))
                                } catch (err) {
                                  alert(err.message)
                                  e.target.value = ''
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {form.samplePhoto && <UploadedPreview src={form.samplePhoto} />}
                        </div>
                        <small style={{ color: '#888', display: 'block' }}>
                          Accepted formats: PDF, JPG, JPEG, PNG
                        </small>

                        {errors.samplePhoto && (
                          <div
                            style={{
                              color: '#ff2e85',
                            }}
                          >
                            {errors.samplePhoto}
                          </div>
                        )}
                      </CCol>
                    </>
                  )}

                  {/* Submit */}
                  {form.serviceStatus && (
                    <CCol md={12} className="mt-5 d-flex justify-content-end">
                      <CButton
                        style={{ background: NGK_COLORS.primary, color: '#fff' }}
                        type="submit"
                        disabled={loading} // <-- Remove serviceStatus check HERE
                      >
                        {loading ? 'Submitting...' : 'Submit'}
                      </CButton>
                    </CCol>
                  )}
                </CRow>
              </>
            </CForm>
          </div>

          <AadhaarConsentModal show={showAadhaarModal} onClose={() => setShowAadhaarModal(false)} />

          <UserConsentModal show={showConsentModal} onClose={() => setShowConsentModal(false)} />
        </div>
      </div>
    </div>
  )
}
const selectStyles = {
  control: (base) => ({
    ...base,
    borderColor: '#ccc',
    color: '#000',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#000', // selected value color
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#000', // selected chips text
  }),
  option: (base, state) => ({
    ...base,
    color: '#000', // dropdown text
    backgroundColor: state.isSelected ? '#ffe0f1' : '#fff',
    ':hover': {
      backgroundColor: '#ffeaf6',
      color: '#000',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#777', // placeholder grey
  }),
}
