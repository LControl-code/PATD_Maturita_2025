// app/tests/page.tsx

import { TestDataTable } from '@/components/tests/TestDataTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Test Data | Delta Motor Testing',
    description: 'View and analyze motor test data from all stations',
};

/**
 * Mock test data for initial UI development
 */
const mockTestData = [
    {
        id: '1',
        device_code: 'P42589487#1TF18269334#ZSXXUR#',
        device_type: 'za34s504j3zt221',
        station: '354pc242q17711j',
        test_data: {
            'Finish_Temp': 25.357,
            'L12': 2.102,
            'L12_1': 1.881,
            'L13': 2.525,
            'L14': 3.965,
            'L15': 4.493
        },
        test_fail: true,
        time: '2025-02-26T17:41:30.689Z',
        expand: {
            device_type: {
                id: 'za34s504j3zt221',
                name: 'EFAD'
            },
            station: {
                id: '354pc242q17711j',
                name: 'R23',
                line: 'line2'
            }
        }
    },
    {
        id: '2',
        device_code: 'P82746251#1TF29384756#ABCDEF#',
        device_type: '4ga1301185f2rla',
        station: '5t9v9g2n56xs4zb',
        test_data: {
            'Finish_Temp': 24.871,
            'L12': 1.498,
            'L12_1': 1.542,
            'L13': 2.233,
            'L14': 3.684,
            'L15': 4.191
        },
        test_fail: false,
        time: '2025-02-26T17:35:12.452Z',
        expand: {
            device_type: {
                id: '4ga1301185f2rla',
                name: 'ERAD'
            },
            station: {
                id: '5t9v9g2n56xs4zb',
                name: 'A20',
                line: 'line1'
            }
        }
    },
    {
        id: '3',
        device_code: 'P12345678#1TF87654321#UVWXYZ#',
        device_type: 'za34s504j3zt221',
        station: '354pc242q17711j',
        test_data: {
            'Finish_Temp': 26.124,
            'L12': 1.875,
            'L12_1': 1.742,
            'L13': 2.318,
            'L14': 3.752,
            'L15': 4.287
        },
        test_fail: false,
        time: '2025-02-26T17:28:45.213Z',
        expand: {
            device_type: {
                id: 'za34s504j3zt221',
                name: 'EFAD'
            },
            station: {
                id: '354pc242q17711j',
                name: 'R23',
                line: 'line2'
            }
        }
    },
    {
        id: '4',
        device_code: 'P98765432#1TF12345678#ABCXYZ#',
        device_type: '4ga1301185f2rla',
        station: '354pc242q17711j',
        test_data: {
            'Finish_Temp': 25.731,
            'L12': 1.724,
            'L12_1': 1.653,
            'L13': 2.489,
            'L14': 3.821,
            'L15': 4.376
        },
        test_fail: true,
        time: '2025-02-26T17:22:18.876Z',
        expand: {
            device_type: {
                id: '4ga1301185f2rla',
                name: 'ERAD'
            },
            station: {
                id: '354pc242q17711j',
                name: 'R23',
                line: 'line2'
            }
        }
    },
    {
        id: '5',
        device_code: 'P36925814#1TF75395128#LMNOPQ#',
        device_type: 'za34s504j3zt221',
        station: '5t9v9g2n56xs4zb',
        test_data: {
            'Finish_Temp': 24.932,
            'L12': 1.658,
            'L12_1': 1.589,
            'L13': 2.267,
            'L14': 3.701,
            'L15': 4.215
        },
        test_fail: false,
        time: '2025-02-26T17:15:32.541Z',
        expand: {
            device_type: {
                id: 'za34s504j3zt221',
                name: 'EFAD'
            },
            station: {
                id: '5t9v9g2n56xs4zb',
                name: 'A20',
                line: 'line1'
            }
        }
    },
];

// Generate more mock data for pagination testing
const generateMockData = () => {
    const result = [...mockTestData];

    // Add 20 more mock records based on the initial 5 but with different timestamps
    for (let i = 0; i < 4; i++) {
        mockTestData.forEach((item, index) => {
            const newTime = new Date(item.time);
            // Subtract a few hours for each batch to create older data
            newTime.setHours(newTime.getHours() - (i + 1) * 2);

            result.push({
                ...item,
                id: `${result.length + 1}`,
                time: newTime.toISOString(),
                // Randomize pass/fail
                test_fail: Math.random() > 0.7
            });
        });
    }

    return result;
};

/**
 * Test Data Page Component
 * Displays a table of all test data with filtering and pagination
 */
export default function TestDataPage() {
    // Use the expanded mock data for UI development
    const mockData = generateMockData();

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Test Data</h1>
                <p className="text-muted-foreground">
                    View and search all test data across stations and devices
                </p>
            </div>

            <TestDataTable data={mockData} />
        </div>
    );
}