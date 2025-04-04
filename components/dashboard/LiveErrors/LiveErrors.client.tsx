"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { format } from 'date-fns'
import Link from 'next/link'
import { AlertOctagon, Filter } from 'lucide-react'
import { ErrorData } from '@/types/errors'


interface LiveErrorsProps {
  initialData: ErrorData[];
}

/**
 * A client-side component that displays live errors in a filterable list view.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {ErrorData[]} props.initialData - Initial array of error data to display
 * 
 * @remarks
 * The component features:
 * - Real-time error updates
 * - Station filtering capabilities
 * - Animated error list items
 * - Detailed error information in a slide-out sheet
 * - Responsive scroll area
 * 
 * @example
 * ```tsx
 * <LiveErrorsClient initialData={errorData} />
 * ```
 * 
 * The error data is displayed in a card with:
 * - Station filter dropdown
 * - Timestamp and station name for each error
 * - Error count badge
 * - Detailed view with device information and test results
 * - Link to device page
 */
const LiveErrorsClient: React.FC<LiveErrorsProps> = ({ initialData }) => {
  const [errors, setErrors] = useState<ErrorData[]>(initialData)
  const [selectedStation, setSelectedStation] = useState<string>("all")

  // Update local state when server data changes
  useEffect(() => {
    setErrors(initialData)
  }, [initialData])

  const stations = useMemo(() =>
    Array.from(new Set(errors.map(error => error.station_name))),
    [errors]
  )

  const filteredErrors = useMemo(() =>
    selectedStation === "all"
      ? errors
      : errors.filter(error => error.station_name === selectedStation),
    [selectedStation, errors]
  )

  const formatStationName = useCallback((station: string) => {
    return station.toUpperCase()
  }, [])

  const errorVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col"
    >
      <Card className="grow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Live Errors</CardTitle>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station} value={station}>
                    {formatStationName(station)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] lg:h-[300px] pr-4">
            <AnimatePresence initial={false}>
              {filteredErrors.length > 0 ? (
                <motion.ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {filteredErrors.map((error) => (
                      <motion.li
                        key={error.device_id}
                        variants={errorVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 1
                        }}
                        layout
                      >
                        <Sheet>
                          <SheetTrigger asChild>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-3 rounded-lg border border-gray-200 transition-colors duration-200">
                              <div className="flex items-center space-x-3">
                                <AlertOctagon className="w-5 h-5 text-destructive" />
                                <div>
                                  <span className="font-semibold">{format(new Date(error.time), 'HH:mm:ss')}</span>
                                  <span className="mx-2">-</span>
                                  <span className="font-medium">{formatStationName(error.station_name)}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-sm">
                                {error.test_data.errors.length} {error.test_data.errors.length === 1 ? 'error' : 'errors'}
                              </Badge>
                            </div>
                          </SheetTrigger>
                          <SheetContent
                            side="right"
                          >
                            <div className="flex flex-col h-full">
                              <SheetHeader>
                                <SheetTitle className="text-2xl font-bold">
                                  Error Details
                                </SheetTitle>
                                <SheetDescription>
                                  {format(new Date(error.time), 'HH:mm:ss dd.MM.yyyy')} - {formatStationName(error.station_name)}
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 mb-4 pr-4">
                                <h4 className="text-lg font-semibold mb-2">Device Information</h4>
                                <div className="space-y-2">
                                  <Link
                                    href={`/device?deviceCode=${encodeURIComponent(error.device_code)}`}
                                    className="block px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium"
                                  >
                                    Device Code: {error.device_code}
                                  </Link>
                                  <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md">
                                    Device ID: {error.device_id}
                                  </div>
                                </div>
                              </div>
                              <ScrollArea className="grow">
                                <div className="space-y-4">
                                  {error.test_data.errors.map((detail, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                      <h4 className="text-lg font-semibold mb-2">{detail.test}</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="font-medium">Measured:</span> {detail.value.toFixed(3)}
                                        </div>
                                        <div>
                                          <span className="font-medium">Limit:</span> {detail.limit.toFixed(3)}
                                        </div>
                                        <div>
                                          <span className="font-medium">Type:</span> {detail.type}
                                        </div>
                                        <div>
                                          <span className="font-medium">Offset:</span> {detail.offset.toFixed(3)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center items-center h-full"
                >
                  <div className="text-gray-500 text-lg">No errors present</div>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LiveErrorsClient
