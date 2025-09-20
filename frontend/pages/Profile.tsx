"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useAuth } from "../contexts/AuthContext"
import { User, Mail, Phone, MapPin, Save, Camera } from "lucide-react"

export const Profile: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+1 (555) 123-4567",
    department: "Manufacturing",
    location: "Factory Floor A",
    employeeId: "EMP001",
    joinDate: "2023-01-15",
  })

  const handleSave = () => {
    // In a real app, this would update the user profile
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="bg-green-600 hover:bg-green-700"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            "Edit Profile"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture and Basic Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 hover:bg-green-700">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{formData.name}</h3>
                <p className="text-gray-400">{formData.department}</p>
                <p className="text-gray-500 text-sm">ID: {formData.employeeId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-300 text-sm flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white p-2 bg-gray-700 rounded">{formData.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white p-2 bg-gray-700 rounded">{formData.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white p-2 bg-gray-700 rounded">{formData.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Work Location
                </label>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white p-2 bg-gray-700 rounded">{formData.location}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Details */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Employment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Department</label>
              <p className="text-white p-2 bg-gray-700 rounded">{formData.department}</p>
            </div>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Employee ID</label>
              <p className="text-white p-2 bg-gray-700 rounded">{formData.employeeId}</p>
            </div>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">Join Date</label>
              <p className="text-white p-2 bg-gray-700 rounded">{formData.joinDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="bg-blue-600 hover:bg-blue-700">Change Password</Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent">
            Enable Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
