import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useParams } from 'react-router';
import axios from 'axios';
import { getAuthToken } from '../utilities/authentication';
import { useLoader } from '../LoaderContext';
import { FormControl, InputLabel, MenuItem, Select, Paper, } from '@mui/material';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { Close } from '@mui/icons-material';
import worker from './app.worker.js';
import WebWorker from './WebWorker';
import { binarySearch, showError } from '../utilities/helping_functions';
import Card from '@mui/material/Card';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // Access the payload directly
        return (
            <div className="custom-tooltip" style={{ backgroundColor: 'white', paddingLeft: 7, paddingRight: 7, border: '1px solid silver' }}>
                <p style={{ margin: 0, padding: 0, fontSize: 17, marginTop: 10 }} className="label">{`${data.name}`}</p>
                <p style={{ margin: 0, padding: 0, color: 'purple', marginTop: 3, marginBottom: 10 }} className="label">{`${data.fieldName} : ${data.value}`}</p>
            </div>
        );
    }

    return null;
};

const Analytics = () => {
    const webWorker = new WebWorker(worker);
    const { timelineId, timelineName } = useParams();
    const [chartData, setChartData] = useState({});
    const { showLoader, hideLoader } = useLoader();
    const [chartOptions, setChartOptions] = useState([]);
    const [option, setOption] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [sortedList, setSortedList] = useState([]);
    const [info, setInfo] = useState(undefined);
    const [compareOption1, setCompareOption1] = useState('');
    const [compareOption2, setCompareOption2] = useState('');

    useEffect(() => {
        (async () => {
            showLoader();
            const chartOptionsResponse = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/' + timelineId, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            setChartOptions(chartOptionsResponse.data.sortFields);
            hideLoader();
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (option) {
                try {
                    showLoader();
                    const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/analytics/' + timelineId + '/' + option, {
                        headers: {
                            Authorization: `Bearer ${getAuthToken()}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    setChartData(response.data.data);
                    webWorker.postMessage(response?.data?.data[option][`${option}_pie`]);
                    webWorker.addEventListener('message', (event) => {
                        const sortedList = event.data;
                        setSortedList(sortedList);
                        hideLoader();
                    });
                }
                catch (err) {
                    hideLoader();
                    showError('Error Occured', err.message)
                }
            }
        })()
    }, [option])

    useEffect(() => {
        (async () => {
            if (compareOption1 && compareOption2) {
                try {
                    showLoader();
                    const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/analytics/' + timelineId + '/' + compareOption1 + '/' + compareOption2, {
                        headers: {
                            Authorization: `Bearer ${getAuthToken()}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    setChartData(response.data.data);
                    webWorker.postMessage(response?.data?.data[compareOption2][`${compareOption2}_pie`]);
                    webWorker.addEventListener('message', (event) => {
                        const sortedList = event.data;
                        setSortedList(sortedList);
                        hideLoader();
                    });
                }
                catch (err) {
                    hideLoader();
                    showError('Error Occured', err?.response?.data?.message || err.message)
                }
            }
        })()
    }, [compareOption1, compareOption2])

    function capitalize(string) {
        if (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        else {
            return string;
        }
    }

    const chartComponents = useMemo(() => {
        return Object.entries(chartData).map(([fieldName, charts]) => {
            return (
                <div key={fieldName}>
                    <h2 style={{ marginTop: 50 }}>{fieldName === 'date' ? 'Date' : fieldName}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div>
                            <h3>Bar Chart</h3>
                            <BarChart width={window.innerWidth * 0.9} height={500} data={charts[`${fieldName}_bar`]}>
                                <XAxis dataKey="name" />
                                <YAxis textAnchor="end" width={150} angle={-45} />
                                <Tooltip />
                                <Bar dataKey={fieldName} fill="#8884d8" />
                            </BarChart>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: -30 }}>Pie Chart</h3>
                            <PieChart width={window.innerWidth * 0.9} height={window.innerHeight}
                            >
                                <Pie
                                    dataKey="value"
                                    data={charts[`${fieldName}_pie`]}
                                    fill="#8884d8"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    label

                                />
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </div>
                    </div>
                </div>
            );
        });
    }, [chartData])

    const chartOptionsComponent = useMemo(() => {
        return (
            <FormControl style={{ marginTop: '20px', width: '400px' }} fullWidth>
                <InputLabel id="chartOptions-label">Select chart field</InputLabel>
                <Select labelId="chartOptions-label" id="chartOptions" label="Select chart field" style={{ height: 50 }} value={option} onChange={(e) => {
                    setOption(e.target.value);
                    setCompareOption2('');
                }}>
                    {
                        chartOptions?.map((option) => {
                            return (
                                <MenuItem value={option}>{capitalize(option)}</MenuItem>
                            )
                        })
                    }
                </Select>
            </FormControl>
        )
    }, [chartOptions, option])

    const compareChartComponent = useMemo(() => {
        return (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControl style={{ width: '200px' }} fullWidth>
                    <InputLabel id="chartCompareOptions-label">Select x-axis field</InputLabel>
                    <Select labelId="chartCompareOptions-label" id="chartOptions" label="Select x-axis field" style={{ height: 50 }} value={compareOption1} onChange={(e) => {
                        setCompareOption1(e.target.value);
                    }}>
                        {
                            chartOptions?.map((option) => {
                                return (
                                    <MenuItem value={option}>{capitalize(option)}</MenuItem>
                                )
                            })
                        }
                    </Select>
                </FormControl>
                <FormControl style={{ width: '200px' }} fullWidth>
                    <InputLabel id="chartCompareOptions-label">Select y-axis field</InputLabel>
                    <Select labelId="chartCompareOptions-label" id="chartOptions" label="Select y-axis field" style={{ height: 50 }} value={compareOption2} onChange={(e) => {
                        setCompareOption2(e.target.value);
                        setOption('');
                    }}>
                        {
                            chartOptions?.map((option) => {
                                if (option === compareOption1) {
                                    return null;
                                }
                                return (
                                    <MenuItem value={option}>{capitalize(option)}</MenuItem>
                                )
                            })
                        }
                    </Select>
                </FormControl>
            </div>
        )
    }, [chartOptions, compareOption1, compareOption2])

    const searchComponent = useMemo(() => {
        return (
            <Paper
                component="form"
                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 390, marginTop: '20px' }}
                onSubmit={(e) => {
                    e.preventDefault();
                }}
            >
                <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder={"Search by " + option}
                    value={searchValue}
                    onChange={(e) => {
                        const searchString = e.target.value;
                        setSearchValue(searchString);
                    }}
                />

                <IconButton type="button" sx={{ p: '10px' }} aria-label="search" onClick={() => {
                    const result = binarySearch(sortedList, searchValue);

                    if (result.index !== -1) {
                        const searchedData = sortedList[result.index];
                        setInfo({ name: searchedData.name, value: searchedData.value, color: searchedData.fill });
                    }
                    else {
                        setInfo(undefined);
                        alert('Not found');
                    }
                }} >
                    <SearchIcon />
                </IconButton>
            </Paper>
        )
    }, [searchValue, sortedList])

    return (
        <div style={{ marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ textAlign: 'center' }}>{timelineName}</h1>
            {compareChartComponent}
            {chartOptionsComponent}
            {searchComponent}
            {
                (!option && !compareOption1 && !compareOption2) && <h2 style={{ marginTop: '10%' }}>No chart field is selected yet!</h2>
            }
            {chartComponents}
            {
                info && (
                    <Card className="custom-tooltip" style={{ backgroundColor: 'white', paddingLeft: 7, paddingRight: 7, position: "fixed", top: 350, width: '300px', height: '100px' }}>
                        <div style={{ marginLeft: '280px', cursor: 'pointer' }}
                            onClick={() => {
                                setInfo(undefined);
                            }} >
                            <Close style={{ color: 'red' }} />
                        </div>
                        <p style={{ margin: 0, padding: 0, fontSize: 24, marginTop: -7 }} className="label">{`${info.name}`}</p>
                        <p style={{ color: 'purple', marginTop: 10, fontSize: 20 }} className="label">{`${capitalize(option || compareOption2)}: ${info.value}`}</p>
                    </Card>
                )
            }
            <div style={{ height: '150px' }} />
        </div>
    );
};

export default Analytics;
