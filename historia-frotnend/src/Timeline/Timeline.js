import styles from './Timeline.module.css';
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import { useParams } from 'react-router';
import { Delete, Edit, Done, ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { showDeleteConfirmation, showError } from '../utilities/helping_functions';
import { FormControl, InputLabel, MenuItem, Select, Radio, RadioGroup, Checkbox } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, Grid } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import moment from 'moment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import North from '@mui/icons-material/North';
import South from '@mui/icons-material/South';
import Card from '@mui/material/Card';
import { useLoader } from '../LoaderContext';
import { getAuthToken } from '../utilities/authentication';
import axios from 'axios';
import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import InfiniteScroll from "react-infinite-scroll-component";


function TimelineScreen({ props }) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleEditOpen = () => setEditOpen(true);
    const { timelineId, timelineName } = useParams();
    const [timeline, setTimeline] = useState({ name: '', events: [] });
    const [newEvent, setNewEvent] = useState({ date: '' });
    const [editableEvent, setEditableEvent] = useState({});
    const [newAttributeName, setNewAttributeName] = useState('');
    const modalRef = useRef(null);
    const [sortOptions, setSortOptions] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [attributeValueSwitch, setAttributeValueSwitch] = useState(true);
    const [excludedValueSwitch, setExcludedValueSwitch] = useState(false);
    const [sortSwitch, setSortSwitch] = useState(false);
    const [dateSwitch, setDateSwitch] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [excludedValue, setExcludedValue] = useState('');
    const [sortBy, setSortBy] = useState('');
    const orderType = { ASCENDING: 'ASCENDING', DESCENDING: 'DESCENDING' };
    const [sortOrder, setSortOrder] = useState(orderType.ASCENDING);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { isLoading, showLoader, hideLoader } = useLoader();
    const [dateName, setDateName] = useState('date');
    const [editDateName, setEditDateName] = useState(false);
    const [editDateNameForEventToEdit, setEditDateNameForEventToEdit] = useState(false);
    const [openDateModal, setOpenDateModal] = useState(null);
    const [titles, setTitles] = useState([]);
    const fileInputRef = useRef(null);
    const [fileData, setFileData] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [time, setTime] = useState(Date.now());
    const [hasMore, setHasMore] = useState(true);
    const [showFilter, setShowFilter] = useState(false);
    const [currentEventDate, setCurrentEventDate] = useState(null);
    const [dateBadge, setDateBadge] = useState(true);
    const [isDateAttributeSelected, setIsDateAttributeSelected] = useState(false);
    const [attributesToImport, setAttributesToImport] = useState({});
    const [existingAttributes, setExistingAttributes] = useState([]);
    const [mergingAttributes, setMergingAttributes] = useState([]);
    const [doMergeAttributes, setDoMergeAttributes] = useState(false);
    const [specificAttribute, setSpecificAttribute] = useState('');
    const [searchValueBySpecificAttribute, setSearchValueBySpecificAttribute] = useState('');
    const [specificAttributeForExcludedValue, setSpecificAttributeForExcludedValue] = useState('');
    const [searchExcludedValueBySpecificAttribute, setSearchExcludedValueBySpecificAttribute] = useState('');
    const [specificAttributeValueSwitch, setSpecificAttributeValueSwitch] = useState(false);
    const [attributeExcludedValueSwitch, setAttributeExcludedValueSwitch] = useState(false);
    const [importAllAttributes, setImportAllAttributes] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                showLoader();
                const sortFieldsResponse = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/' + timelineId, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json',
                    },
                });

                const response = await axios.post(process.env.REACT_APP_SERVER_URL + '/event/' + timelineId + '/' + 0 + '/' + time,
                    {
                        searchValue, excludedValue, sortBy, startDate, endDate, attributeValueSwitch,
                        excludedValueSwitch, sortSwitch, dateSwitch, sortOrder, specificAttributeValueSwitch,
                        attributeExcludedValueSwitch, specificAttribute, searchValueBySpecificAttribute,
                        specificAttributeForExcludedValue, searchExcludedValueBySpecificAttribute,
                        uniqueFields: sortFieldsResponse.data.sortFields.filter((option) => option !== 'date')
                    }, {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json',
                    },
                });

                const loadedData = {
                    name: timelineName,
                    events: response.data.events
                }

                setTimeline(loadedData);
                setSortOptions(sortFieldsResponse.data.sortFields);

                if (response.data.events.length === 0) {
                    setHasMore(false);
                }
            } catch (error) {
                showError('Error Occured', error.message);
            }
            finally {
                hideLoader();
            }
        })()
    }, [time]);

    // scroll down automatically whenever new attribute added in modal
    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.scrollTop = modalRef.current.scrollHeight;
        }
    }, [newAttributeName]);

    useEffect(() => {
        window.scrollTo(0, 0);
        filter();
    }, [
        searchValue, excludedValue, sortBy, startDate, endDate, attributeValueSwitch, excludedValueSwitch, sortSwitch, dateSwitch, sortOrder,
        specificAttributeValueSwitch, attributeExcludedValueSwitch, specificAttribute, searchValueBySpecificAttribute,
        specificAttributeForExcludedValue, searchExcludedValueBySpecificAttribute
    ]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleClose = () => {
        setOpen(false);
        setEditDateName(false);
    }

    const handleEditClose = () => {
        setEditOpen(false);
        setEditDateNameForEventToEdit(false);
    }

    const handleOpenDateModal = () => {
        setOpenDateModal(true);
    }

    const handleCloseDateModal = () => {
        setOpenDateModal(false);
        resetFileInput();
        setSelectedTitle('');
        setIsDateAttributeSelected(false);
        setAttributesToImport({});
        setExistingAttributes([]);
        setMergingAttributes([])
        setDoMergeAttributes(false);
        setImportAllAttributes(false);
    }

    const handleTitleChange = (event) => {
        setSelectedTitle(event.target.value);
    };

    function filter() {
        setTime(Date.now());
        setHasMore(true);
    }

    function isValidDate(dateString) {
        const parsedDate = moment(dateString, 'MMMM DD, YYYY', true);
        return parsedDate.isValid();
    }

    // function compareByDateByAscendingOrder(a, b) {
    //     const dateA = new Date(a.date.date);
    //     const dateB = new Date(b.date.date);

    //     if (isValidDate(a.date.date) && isValidDate(b.date.date)) {
    //         return dateA - dateB;
    //     } else if (isValidDate(a.date.date)) {
    //         return -1; // a is valid, b is invalid, so a comes first
    //     } else if (isValidDate(b.date.date)) {
    //         return 1; // a is invalid, b is valid, so b comes first
    //     } else {
    //         return 0; // both are invalid, no change in order
    //     }
    // }

    const handleStartDateChange = (event) => {
        const date = event.target.value;
        setStartDate(date);
    };

    const handleEndDateChange = (event) => {
        const date = event.target.value;
        setEndDate(date);
    };

    function capitalize(string) {
        if (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        else {
            return string;
        }
    }

    const getFileType = (file) => {
        const fileNameParts = file.name.split('.');
        const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
        return fileExtension === 'csv' ? 'csv' : fileExtension === 'xlsx' ? 'xlsx' : 'unsupported';
    };

    const handleFileChange = (e) => {
        showLoader();
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileType = getFileType(file);
                if (fileType === 'csv') {
                    // Process CSV using Papaparse
                    Papa.parse(e.target.result, {
                        complete: (result) => {
                            const titles = result.data.length > 0 ? result.data[0] : [];
                            setTitles(titles);
                            setFileData(result.data);
                            handleOpenDateModal();
                            hideLoader();
                        },
                    });
                } else if (fileType === 'xlsx') {
                    // Process XLSX using XLSX
                    const workbook = read(e.target.result, { type: 'binary' });
                    const sheetData = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                    const titles = sheetData.length > 0 ? sheetData[0] : [];
                    setTitles(titles);
                    setFileData(sheetData);
                    handleOpenDateModal();
                    hideLoader();
                } else {
                    hideLoader();
                    showError('Error Occured', 'Unsupported file type');
                }
            };
            reader.readAsBinaryString(file);
        } else {
            showError('Error Occured', 'No file selected');
        }
    };

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // Reset the input value to null
        }
    };

    const handleScroll = (event) => {
        const items = document.querySelectorAll('.event-item');
        let visibleDate = null;
        const mouseY = mousePosition.y + 100;

        items.forEach((item) => {
            const itemRect = item.getBoundingClientRect();
            if (itemRect.top <= mouseY && itemRect.bottom >= mouseY) {
                visibleDate = item.dataset.date;
            }
        });


        if (visibleDate !== null) {
            setCurrentEventDate(visibleDate);
        }
    };

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const memoizedData = useMemo(() => {
        return (
            <Timeline position="alternate" style={{ marginTop: '20px', width: '100%' }}  >
                {
                    timeline?.events?.map((item, i) => {
                        return (
                            <TimelineItem className={"event-item"} data-date={item?.date?.date} key={i} color="success" >
                                <TimelineSeparator>
                                    <TimelineDot color={i % 2 == 0 ? 'success' : 'secondary'} />
                                    <TimelineConnector />
                                    {
                                        i + 1 === timeline?.events?.length && (
                                            <TimelineDot />
                                        )
                                    }
                                </TimelineSeparator>

                                <TimelineContent style={{ textAlign: 'left', cursor: 'pointer', width: '1%' }} onClick={() => {
                                    // click to edit event 
                                    setEditableEvent(item);
                                    handleEditOpen();
                                }}>
                                    <Card sx={{ padding: '10px', }}>
                                        {
                                            Object.keys(item)?.map((key, j) => {
                                                if (key === '_id' || key === 'timelineId') {
                                                    return;
                                                }
                                                return (
                                                    <div key={j} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '18px', paddingRight: '5px', flex: '0 0 auto' }}>{key === 'date' ? capitalize(item[key].name) : capitalize(key)}:</span>
                                                        <h3 style={{ margin: 0, flexWrap: 'wrap', }}>{key === 'date' ? item[key].date : item[key]}</h3>
                                                        {key === 'date' && !isValidDate(item[key].date)
                                                            && (
                                                                <ErrorOutlineIcon style={{ marginLeft: 10, color: 'orange', marginTop: 2 }}
                                                                    onMouseEnter={(event) => {
                                                                        setIsHovered(true);
                                                                        setMousePosition({ x: event.clientX, y: event.clientY });

                                                                    }}
                                                                    onMouseLeave={() => {
                                                                        setIsHovered(false);
                                                                    }}
                                                                />
                                                            )
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                        <Button variant="contained" style={{ height: 35, marginTop: 10 }} color="error" onClick={(event) => {
                                            event.stopPropagation();
                                            showDeleteConfirmation('Delete event', 'Do you want to delete event?', async () => {
                                                try {
                                                    showLoader();
                                                    await axios.delete(process.env.REACT_APP_SERVER_URL + '/event', {
                                                        headers: {
                                                            Authorization: `Bearer ${getAuthToken()}`,
                                                            'Content-Type': 'application/json',
                                                        },
                                                        data: {
                                                            _id: item._id,
                                                            timelineId
                                                        }
                                                    });

                                                    timeline.events.splice(i, 1);
                                                    setTimeline({
                                                        name: timelineName,
                                                        events: timeline.events
                                                    });
                                                }
                                                catch (error) {
                                                    showError('Error Occured', error.message);
                                                }
                                                finally {
                                                    hideLoader();
                                                }
                                            });
                                        }} >
                                            <Delete style={{ fontSize: 18, marginRight: 10, marginLeft: -2.5 }} />
                                            Delete
                                        </Button>
                                    </Card>
                                </TimelineContent>
                            </TimelineItem>
                        )
                    })
                }
                {isHovered && <div
                    style={{
                        position: 'fixed',
                        top: mousePosition.y + 10,
                        left: mousePosition.x + 10,
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '5px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                    }}
                >
                    Invalid date
                </div>
                }
            </Timeline>
        )
    }, [timeline, isHovered, mousePosition]);

    async function loadMore() {
        try {
            const response = await axios.post(process.env.REACT_APP_SERVER_URL + '/event/' + timelineId + '/' + timeline.events.length + '/' + time, {
                searchValue, excludedValue, sortBy, startDate, endDate, attributeValueSwitch,
                excludedValueSwitch, sortSwitch, dateSwitch, sortOrder, specificAttributeValueSwitch,
                attributeExcludedValueSwitch, specificAttribute, searchValueBySpecificAttribute,
                specificAttributeForExcludedValue, searchExcludedValueBySpecificAttribute,
                uniqueFields: sortOptions.filter((option) => option !== 'date')
            }, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json',
                }
            });

            setTimeline({
                name: timelineName,
                events: timeline.events.concat(response.data.events)
            });

            if (response.data.events.length === 0) {
                setHasMore(false)
            }
        } catch (error) {
            showError('Error Occured', error.message);
        }
    }

    const downloadCSV = (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, timeline.name + '.csv');
        } else {
            // Other browsers
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = timeline.name + '.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const downloadXLSX = (xlsx) => {
        const blob = new Blob([xlsx], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');

        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, timelineName + '.xlsx');
        } else {
            // Other browsers
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = timelineName + '.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleCheckboxChange = (name) => (event) => {
        setAttributesToImport({ ...attributesToImport, [name]: event.target.checked });
    };

    const mergingComponent = useMemo(() => {
        return (
            mergingAttributes.map((_, mergingIndex) => {
                return <div key={mergingIndex} style={{ display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 10, alignItems: 'center' }}>
                    <FormControl fullWidth disabled={!doMergeAttributes}>
                        <InputLabel id="select-label-1">Existing Attributes</InputLabel>
                        <Select
                            labelId="select-label-1"
                            id="select-1"
                            value={mergingAttributes[mergingIndex].mergingAttribute1}
                            label="Existing Attributes"
                            onChange={(event) => {
                                mergingAttributes[mergingIndex].mergingAttribute1 = event.target.value;
                                setMergingAttributes([...mergingAttributes]);
                            }}
                        >
                            {
                                existingAttributes.map((attribute, i) => {
                                    return (
                                        <MenuItem key={i} value={attribute}>{attribute}</MenuItem>
                                    )
                                })
                            }
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ marginLeft: 2 }} disabled={!doMergeAttributes}>
                        <InputLabel id="select-label-2">New Attributes</InputLabel>
                        <Select
                            labelId="select-label-2"
                            id="select-2"
                            value={mergingAttributes[mergingIndex].mergingAttribute2}
                            label="New Attributes"
                            onChange={(event) => {
                                mergingAttributes[mergingIndex].mergingAttribute2 = event.target.value;
                                setMergingAttributes([...mergingAttributes]);
                            }}
                        >
                            {
                                Object.entries(attributesToImport).map((attribute, i) => {
                                    if (attribute[1])
                                        return (
                                            <MenuItem key={i} value={attribute[0]}>{attribute[0]}</MenuItem>
                                        )
                                })
                            }
                        </Select>
                    </FormControl>
                    <div style={{ height: 20, cursor: 'pointer', marginLeft: 10 }}
                        onClick={() => {
                            mergingAttributes.splice(mergingIndex, 1);
                            setMergingAttributes([...mergingAttributes]);
                        }} >
                        <Delete style={{ color: '#C8102E', }} />
                    </div>
                </div>
            })
        )
    }, [mergingAttributes, attributesToImport, doMergeAttributes])

    return (
        <InfiniteScroll
            dataLength={timeline.events.length}
            next={() => {
                loadMore();
            }}
            hasMore={hasMore}
            loader={<h4 style={{ textAlign: 'center' }}>Loading...</h4>}
            scrollThreshold={0.6}
            style={{ overflowX: 'hidden' }}
        >
            <div className={styles.timeline_main} >
                <h1>{timeline.name}</h1>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Button color="primary" variant="contained" onClick={() => {
                        if (timeline.events.length !== 0) {
                            const newEventObject = {}
                            const keys = Object.keys(timeline.events[timeline.events.length - 1]);
                            for (let i = 0; i < keys.length; i++) {
                                if (keys[i] === '_id') {
                                    continue;
                                }
                                newEventObject[keys[i]] = '';
                            }
                            setNewEvent(newEventObject)
                        }
                        handleOpen();
                    }}>
                        Add event
                    </Button>

                    <input
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        type="file"
                        accept=".csv, .xlsx"
                        id="file-upload"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                        <Button style={{ marginLeft: 20 }} color="primary" variant="contained" component="span">
                            Import file
                        </Button>
                    </label>

                    <Button style={{ marginLeft: 20 }} color="primary" variant="contained" component="span"
                        onClick={async () => {
                            try {
                                showLoader()
                                const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/export-csv/' + timelineId + '/' + timelineName, {
                                    headers: {
                                        Authorization: `Bearer ${getAuthToken()}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                downloadCSV(response.data);
                            }
                            catch (error) {
                                showError('Error Occured', error.message);
                            }
                            finally {
                                hideLoader();
                            }
                        }}>
                        Export CSV file
                    </Button>

                    <Button style={{ marginLeft: 20 }} color="primary" variant="contained" component="span"
                        onClick={async () => {
                            try {
                                showLoader()
                                const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/export-xlsx/' + timelineId + '/' + timelineName, {
                                    headers: {
                                        Authorization: `Bearer ${getAuthToken()}`,
                                        'Content-Type': 'application/json',
                                    },
                                    responseType: 'blob'
                                });

                                downloadXLSX(response.data);
                            }
                            catch (error) {
                                showError('Error Occured', error.message);
                            }
                            finally {
                                hideLoader();
                            }
                        }}>
                        Export to Excel Sheet
                    </Button>
                </div>

                <Modal
                    open={openDateModal}
                    onClose={handleCloseDateModal}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    {
                        (<div ref={modalRef} className={styles.timeline_modal_container}>
                            {
                                !isDateAttributeSelected ? <h2 id="create-timeline-modal" style={{ textAlign: 'center' }}>
                                    Choose a heading which contains dates <br />(These dates will be used to place <br />the events on the timeline)
                                </h2>
                                    : <h2 id="create-timeline-modal" style={{ textAlign: 'center' }}>
                                        Choose which attributes you want to import
                                    </h2>
                            }
                            <FormControl component="fieldset" style={{ alignSelf: 'flex-start' }}>
                                {
                                    !isDateAttributeSelected ? (
                                        <RadioGroup
                                            aria-label="title"
                                            name="title"
                                            value={selectedTitle}
                                            onChange={handleTitleChange}
                                        >
                                            {titles?.map((title) => (
                                                <FormControlLabel
                                                    key={title}
                                                    value={title}
                                                    control={<Radio />}
                                                    label={title}
                                                />
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        <FormGroup>
                                            <FormControlLabel
                                                control={<Checkbox
                                                    checked={importAllAttributes}
                                                    onChange={(e) => {
                                                        setImportAllAttributes(e.target.checked);
                                                        titles.forEach((title) => {
                                                            if (selectedTitle === title) {
                                                                return;
                                                            }
                                                            if (e.target.checked) {
                                                                attributesToImport[title] = true;
                                                            }
                                                            else {
                                                                attributesToImport[title] = false;
                                                            }
                                                        })
                                                        setAttributesToImport({
                                                            ...attributesToImport
                                                        });
                                                    }}
                                                />}
                                                label={'All'}
                                                style={{
                                                    marginBottom: 10
                                                }}
                                            />
                                            {
                                                titles?.map((title, i) => (
                                                    <FormControlLabel
                                                        key={i}
                                                        control={<Checkbox
                                                            checked={attributesToImport[title]}
                                                            disabled={selectedTitle !== title ? false : true}
                                                            onChange={handleCheckboxChange(title)}
                                                        />}
                                                        label={title}
                                                    />
                                                ))}
                                        </FormGroup>
                                    )
                                }

                                {
                                    isDateAttributeSelected && timeline?.events?.length !== 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
                                            <FormControlLabel
                                                control={<Checkbox
                                                    checked={doMergeAttributes}
                                                    onChange={(event) => {
                                                        setDoMergeAttributes(event.target.checked)
                                                    }}
                                                />}
                                                label={<h2 id="create-timeline-modal" style={{ textAlign: 'center', opacity: doMergeAttributes ? 1 : 0.4 }}>
                                                    Choose which attributes you want to merge
                                                </h2>}
                                            />
                                            {mergingComponent}
                                            <Button variant="outlined" disabled={!doMergeAttributes} onClick={() => {
                                                mergingAttributes.push({
                                                    mergingAttribute1: '',
                                                    mergingAttribute2: ''
                                                });
                                                setMergingAttributes([...mergingAttributes]);
                                            }}>Add</Button>
                                        </div>
                                    )
                                }
                            </FormControl>
                            {!isDateAttributeSelected ? <Button
                                variant="contained"
                                color="primary"
                                onClick={async () => {
                                    try {
                                        if (!selectedTitle) {
                                            alert('Please select a field')
                                            return;
                                        }
                                        // todo loader // maybe in button
                                        const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/event/headers/' + timelineId, {
                                            headers: {
                                                Authorization: `Bearer ${getAuthToken()}`,
                                                'Content-Type': 'application/json',
                                            },
                                        });
                                        setExistingAttributes(response.data.headers);
                                        setIsDateAttributeSelected(true);
                                        const attributesToImport = {}
                                        for (let i = 0; i < titles.length; i++) {
                                            if (titles[i] !== selectedTitle) {
                                                attributesToImport[titles[i]] = false;
                                            }
                                            else {
                                                attributesToImport[titles[i]] = true;
                                            }
                                        }
                                        setAttributesToImport(attributesToImport);
                                    }
                                    catch (error) {
                                        showError('Error Occured', error.message);
                                    }
                                    finally {
                                        hideLoader();
                                    }
                                }}
                            >
                                Next
                            </Button>
                                : <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={async () => {
                                        if (doMergeAttributes) {
                                            for (let i = 0; i < mergingAttributes.length; i++) {
                                                if (!mergingAttributes[i].mergingAttribute1 || !mergingAttributes[i].mergingAttribute2) {
                                                    alert('Please select all menus');
                                                    return;
                                                }
                                            }
                                        }

                                        const events = [];
                                        try {
                                            handleCloseDateModal();
                                            showLoader();

                                            function doesMergingApply(title) {
                                                for (let i = 0; i < mergingAttributes.length; i++) {
                                                    if (mergingAttributes[i].mergingAttribute2 === title) {
                                                        return mergingAttributes[i].mergingAttribute1;
                                                    }
                                                }
                                                return null;
                                            }

                                            for (let i = 1; i < fileData.length; i++) {
                                                const object = { timelineId };
                                                for (let j = 0; j < titles.length; j++) {
                                                    if (fileData[i][j] && attributesToImport[titles[j]]) {
                                                        const attribute1 = doesMergingApply(titles[j]);
                                                        if (titles[j] === selectedTitle) {
                                                            if (attribute1) {
                                                                object['date'] = {
                                                                    name: attribute1,
                                                                    date: fileData[i][j]
                                                                };
                                                            }
                                                            else {
                                                                object['date'] = {
                                                                    name: selectedTitle,
                                                                    date: fileData[i][j]
                                                                };
                                                            }
                                                        } else {
                                                            if (attribute1) {
                                                                object[attribute1] = fileData[i][j];
                                                            }
                                                            else {
                                                                object[titles[j]] = fileData[i][j];
                                                            }
                                                        }
                                                    }
                                                }
                                                if (object?.date?.date) {
                                                    events.push(object);
                                                }
                                            }

                                            if (events.length === 0) {
                                                hideLoader();
                                                return;
                                            }

                                            console.log(events)

                                            // send file data to server
                                            await axios.post(process.env.REACT_APP_SERVER_URL + '/event/multiples', {
                                                timelineId,
                                                newEvents: events,
                                            }, {
                                                headers: {
                                                    Authorization: `Bearer ${getAuthToken()}`,
                                                    'Content-Type': 'application/json',
                                                },
                                            });

                                            setTime(Date.now());
                                            setHasMore(true);

                                            handleCloseDateModal()
                                        }
                                        catch (error) {
                                            showError('Error Occured', error.message);
                                        }
                                        finally {
                                            hideLoader();
                                        }
                                    }}
                                >
                                    Done
                                </Button>
                            }
                        </div>
                        )
                    }
                </Modal>

                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <div
                        ref={modalRef} className={styles.timeline_modal_container}>
                        <h2 id="create-timeline-modal">Create Event</h2>
                        {
                            editDateName && (
                                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 40, width: '100%', justifyContent: 'space-between' }}>
                                    <TextField
                                        label={"Enter date name"}
                                        id="standard-basic" variant="standard"
                                        style={{ width: '350px' }}
                                        value={dateName}
                                        onChange={(e) => {
                                            setDateName(e.target.value);
                                        }}
                                    />
                                    <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                        onClick={() => {
                                            setEditDateName(false);
                                        }} >
                                        <Done style={{ color: 'green' }} />
                                    </div>
                                </div>
                            )
                        }
                        {
                            Object.keys(newEvent)?.map((key, index) => {
                                return (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'flex-start' }}>
                                        <TextField
                                            label={key === "date" ? "Enter " + dateName + " (format: January 01, 2000)" : "Enter " + key}
                                            id="standard-basic" variant="standard"
                                            style={{ width: '350px', marginBottom: 40 }}
                                            value={newEvent[key]}
                                            onChange={(e) => {
                                                setNewEvent({
                                                    ...newEvent,
                                                    [key]: e.target.value
                                                })
                                            }}
                                        />
                                        {
                                            key !== 'date' ? (
                                                <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        delete newEvent[key];
                                                        setNewEvent({ ...newEvent })
                                                    }} >
                                                    <Delete style={{ color: '#C8102E' }} />
                                                </div>
                                            ) : !editDateName &&
                                            (
                                                <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setEditDateName(true);
                                                    }} >
                                                    <Edit color={"secondary"} />
                                                </div>
                                            )
                                        }
                                    </div>
                                )
                            })
                        }
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 40, width: '100%', justifyContent: 'space-between' }}>
                                <TextField
                                    label="Enter new attribute name"
                                    id="standard-basic" variant="standard"
                                    style={{ width: '250px' }}
                                    value={newAttributeName}
                                    onChange={(e) => {
                                        setNewAttributeName(e.target.value);
                                    }}
                                />
                                <Button type="submit" variant="contained" color="primary"
                                    onClick={() => {
                                        if (newAttributeName) {
                                            if (newAttributeName.toLowerCase() === 'date') {
                                                alert('This attribute is not allowed, its already reserved')
                                                return;
                                            }
                                            setNewEvent({
                                                ...newEvent, [newAttributeName]: ''
                                            })
                                            setNewAttributeName('');
                                        }
                                        else {
                                            alert('Please enter attribute name first')
                                        }
                                    }}>
                                    Add
                                </Button>
                            </div>
                            <Button type="submit" variant="contained" color="primary"
                                onClick={async () => {
                                    try {
                                        const values = Object.values(newEvent);
                                        for (let i = 0; i < values.length; i++) {
                                            if (!values[i]) {
                                                alert('Please fill all the attributes\' values');
                                                return;
                                            }
                                        }

                                        if (!isValidDate(newEvent['date'])) {
                                            alert('Date format isn\'t valid');
                                            return;
                                        }

                                        showLoader();
                                        const response = await axios.post(process.env.REACT_APP_SERVER_URL + '/event', {
                                            timelineId,
                                            ...newEvent,
                                            date: {
                                                name: dateName,
                                                date: newEvent.date
                                            }
                                        }, {
                                            headers: {
                                                Authorization: `Bearer ${getAuthToken()}`,
                                                'Content-Type': 'application/json',
                                            },
                                        });

                                        timeline.events.push({
                                            _id: response.data._id,
                                            ...newEvent,
                                            date: {
                                                name: dateName,
                                                date: newEvent.date
                                            }
                                        })

                                        setTimeline({
                                            name: timelineName,
                                            events: timeline.events
                                        })

                                        // Clear new event fields and keep them rather than deleteing because 
                                        // It is more likely that another event in same timeline will have same attributes 
                                        // So it will save user time to add same attributes over and over
                                        const keys = Object.keys(newEvent);
                                        const localSortOptions = [...sortOptions];
                                        for (let i = 0; i < keys.length; i++) {
                                            newEvent[keys[i]] = '';
                                            if (!localSortOptions.includes(keys[i])) {
                                                localSortOptions.push(keys[i]);
                                            }
                                        }
                                        setSortOptions(localSortOptions);
                                        handleClose();
                                    }
                                    catch (error) {
                                        handleClose();
                                        showError('Error Occured', error.message);
                                    }
                                    finally {
                                        hideLoader();
                                    }
                                }}>
                                Create
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    open={editOpen}
                    onClose={handleEditClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <div
                        ref={modalRef} className={styles.timeline_modal_container}>
                        <h2 id="create-timeline-modal">Edit Event</h2>
                        {
                            editDateNameForEventToEdit && (
                                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 40, width: '100%', justifyContent: 'space-between' }}>
                                    <TextField
                                        label={"Enter date name"}
                                        id="standard-basic" variant="standard"
                                        style={{ width: '350px' }}
                                        value={editableEvent.date.name}
                                        onChange={(e) => {
                                            setEditableEvent({
                                                ...editableEvent,
                                                date: {
                                                    ...editableEvent.date,
                                                    name: e.target.value,
                                                }
                                            })
                                        }}
                                    />
                                    <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                        onClick={() => {
                                            setEditDateNameForEventToEdit(false);
                                        }} >
                                        <Done style={{ color: 'green' }} />
                                    </div>
                                </div>
                            )
                        }
                        {
                            Object.keys(editableEvent)?.map((key) => {
                                if (key === '_id') {
                                    return;
                                }
                                return (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'flex-start' }}>
                                        <TextField
                                            label={key === "date" ? "Enter " + editableEvent[key].name + " (format: January 01, 2000)" : "Enter " + key}
                                            id="standard-basic" variant="standard"
                                            style={{ width: '350px', marginBottom: 40 }}
                                            value={key === "date" ? editableEvent[key].date : editableEvent[key]}
                                            onChange={(e) => {
                                                if (key === 'date') {
                                                    setEditableEvent({
                                                        ...editableEvent,
                                                        date: {
                                                            ...editableEvent.date,
                                                            date: e.target.value
                                                        }
                                                    })
                                                }
                                                else {
                                                    setEditableEvent({
                                                        ...editableEvent,
                                                        [key]: e.target.value
                                                    })
                                                }
                                            }}
                                        />

                                        {
                                            key !== 'date' ? (
                                                <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        delete editableEvent[key];
                                                        setEditableEvent({ ...editableEvent })
                                                    }} >
                                                    <Delete style={{ color: '#C8102E' }} />
                                                </div>
                                            ) : !editDateNameForEventToEdit &&
                                            (
                                                <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setEditDateNameForEventToEdit(true);
                                                    }} >
                                                    <Edit color={"secondary"} />
                                                </div>
                                            )
                                        }
                                    </div>
                                )
                            })
                        }
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 40, width: '100%', justifyContent: 'space-between' }}>
                                <TextField
                                    label="Enter new attribute name"
                                    id="standard-basic" variant="standard"
                                    style={{ width: '250px' }}
                                    value={newAttributeName}
                                    onChange={(e) => {
                                        setNewAttributeName(e.target.value);
                                    }}
                                />
                                <Button type="submit" variant="contained" color="primary"
                                    onClick={() => {
                                        if (newAttributeName) {
                                            if (newAttributeName.toLowerCase() === 'date') {
                                                alert('This attribute is not allowed, its already reserved')
                                                return;
                                            }

                                            setEditableEvent({
                                                ...editableEvent, [newAttributeName]: ''
                                            })
                                            setNewAttributeName('');
                                        }
                                        else {
                                            alert('Please enter attribute name first')
                                        }
                                    }}>
                                    Add
                                </Button>
                            </div>
                            <Button type="submit" variant="contained" color="primary"
                                onClick={async () => {
                                    try {
                                        const values = Object.values(editableEvent);
                                        for (let i = 0; i < values.length; i++) {
                                            // there is only one nested object in event's object and that is date
                                            if ((typeof values[i] !== 'object' && !values[i]) || (typeof values[i] === 'object' && !values[i].date)) {
                                                alert('Please fill all the attributes\' values');
                                                return;
                                            }
                                        }

                                        if (!isValidDate(editableEvent['date'].date)) {
                                            alert('Date format isn\'t valid');
                                            return;
                                        }

                                        showLoader();
                                        await axios.put(process.env.REACT_APP_SERVER_URL + '/event', {
                                            ...editableEvent
                                        }, {
                                            headers: {
                                                Authorization: `Bearer ${getAuthToken()}`,
                                                'Content-Type': 'application/json',
                                            },
                                        });

                                        filter();
                                        handleEditClose();

                                        // update sorting options
                                        const keys = Object.keys(editableEvent);
                                        const localSortOptions = [...sortOptions];
                                        for (let i = 0; i < keys.length; i++) {
                                            if (!localSortOptions.includes(keys[i])) {
                                                localSortOptions.push(keys[i]);
                                            }
                                        }
                                        setSortOptions(localSortOptions);
                                    } catch (error) {
                                        handleEditClose();
                                        showError('Error Occured', error.message);
                                    }
                                    finally {
                                        hideLoader();
                                    }
                                }}>
                                Edit
                            </Button>
                        </div>
                    </div>
                </Modal>

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', justifyContent: 'flex-end' }}>

                    {timeline?.events?.length === 0 && isLoading === false && (
                        <div style={{ marginTop: 150, fontSize: 24, fontWeight: 'thin', width: '100%', textAlign: 'center' }}>Nothing to show</div>
                    )}
                    {timeline?.events?.length > 0 &&
                        (
                            <div
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
                                    // marginRight:'35%'    
                                }}
                            >
                                <h2 style={{ marginTop: '20px' }}>Timeline</h2>
                                {memoizedData}
                            </div>
                        )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'fixed', top: 45, margin: 10, marginRight: 0, zIndex: 10 }}>
                        {showFilter && (
                            <Card id={'fliter'} style={{ backgroundColor: 'white', padding: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'row' }} >
                                        <Paper
                                            component="form"
                                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 200, marginTop: '20px' }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            <InputBase
                                                sx={{ ml: 1, flex: 1 }}
                                                placeholder="Search by"
                                                value={searchValueBySpecificAttribute}
                                                onChange={(e) => {
                                                    const searchString = e.target.value;
                                                    setSearchValueBySpecificAttribute(searchString);
                                                }}
                                            />

                                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search" >
                                                <SearchIcon />
                                            </IconButton>
                                        </Paper>
                                        <FormControl>
                                            <InputLabel sx={{ marginTop: '20px' }} id="select-label-3">Attributes</InputLabel>
                                            <Select
                                                labelId="select-label-3"
                                                id="select-3"
                                                value={specificAttribute}
                                                label="Attribute"
                                                onChange={(event) => setSpecificAttribute(event.target.value)}
                                                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 150, marginTop: '20px' }}
                                            >
                                                {
                                                    sortOptions.map((attribute) => {
                                                        return (
                                                            <MenuItem value={attribute}>{attribute}</MenuItem>
                                                        )
                                                    })
                                                }
                                            </Select>
                                        </FormControl>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={specificAttributeValueSwitch} onChange={(event) => {
                                            setSpecificAttributeValueSwitch(event.target.checked);
                                        }} />} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row' }} >
                                        <Paper
                                            component="form"
                                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 200, marginTop: '20px' }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            <InputBase
                                                sx={{ ml: 1, flex: 1 }}
                                                placeholder="Excluded value by"
                                                value={searchExcludedValueBySpecificAttribute}
                                                onChange={(e) => {
                                                    const searchString = e.target.value;
                                                    setSearchExcludedValueBySpecificAttribute(searchString);
                                                }}
                                            />

                                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search" >
                                                <SearchIcon />
                                            </IconButton>
                                        </Paper>
                                        <FormControl >
                                            <InputLabel sx={{ marginTop: '20px' }} id="select-label-3">Attributes</InputLabel>
                                            <Select
                                                labelId="select-label-3"
                                                id="select-3"
                                                value={specificAttributeForExcludedValue}
                                                label="Attribute"
                                                onChange={(event) => setSpecificAttributeForExcludedValue(event.target.value)}
                                                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 150, marginTop: '20px' }}
                                            >
                                                {
                                                    sortOptions.map((attribute) => {
                                                        return (
                                                            <MenuItem value={attribute}>{attribute}</MenuItem>
                                                        )
                                                    })
                                                }
                                            </Select>
                                        </FormControl>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={attributeExcludedValueSwitch} onChange={(event) => {
                                            setAttributeExcludedValueSwitch(event.target.checked);
                                        }} />} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <Paper
                                            component="form"
                                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 350, marginTop: '20px' }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            <InputBase
                                                sx={{ ml: 1, flex: 1 }}
                                                placeholder="Search Events with attribute values"
                                                value={searchValue}
                                                onChange={(e) => {
                                                    const searchString = e.target.value;
                                                    setSearchValue(searchString);
                                                }}
                                            />

                                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search" >
                                                <SearchIcon />
                                            </IconButton>
                                        </Paper>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={attributeValueSwitch} onChange={(event) => {
                                            setAttributeValueSwitch(event.target.checked);
                                        }} />} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <Paper
                                            component="form"
                                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 350, marginTop: '20px' }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            <InputBase
                                                sx={{ ml: 1, flex: 1 }}
                                                placeholder="Search Events with excluded values"
                                                value={excludedValue}
                                                onChange={(e) => {
                                                    const searchString = e.target.value;
                                                    setExcludedValue(searchString);
                                                }}
                                            />
                                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search" >
                                                <SearchIcon />
                                            </IconButton>
                                        </Paper>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={excludedValueSwitch} onChange={(event) => {
                                            setExcludedValueSwitch(event.target.checked)
                                        }} />} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <FormControl style={{ marginTop: '20px' }} fullWidth>
                                            <InputLabel id="sortOptions-label">Sort By</InputLabel>
                                            <Select labelId="sortOptions-label" id="sortOptions" label="Sort By" style={{ height: 50 }} value={sortBy} onChange={(e) => {
                                                setSortBy(e.target.value);
                                            }}>
                                                {
                                                    sortOptions?.map((option) => {
                                                        return (
                                                            <MenuItem value={option}>{option}</MenuItem>
                                                        )
                                                    })
                                                }
                                            </Select>
                                        </FormControl>

                                        <IconButton style={{ marginTop: 20 }} onClick={() => {
                                            if (sortOrder === orderType.ASCENDING) {
                                                setSortOrder(orderType.DESCENDING)
                                            }
                                            else {
                                                setSortOrder(orderType.ASCENDING)
                                            }
                                        }}>
                                            {
                                                sortOrder === orderType.ASCENDING ? (<North />) : (<South />)
                                            }
                                        </IconButton>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={sortSwitch} onChange={(event) => {
                                            setSortSwitch(event.target.checked)
                                        }} />} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                                        <Grid style={{ marginTop: '20px' }} container justifyContent="space-between">
                                            <Grid item>
                                                <TextField
                                                    id="startDate"
                                                    label="Start Date"
                                                    type="date"
                                                    value={startDate}
                                                    onChange={handleStartDateChange}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    style={{ width: 170 }}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <TextField
                                                    id="endDate"
                                                    label="End Date"
                                                    type="date"
                                                    value={endDate}
                                                    onChange={handleEndDateChange}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    style={{ width: 170 }}
                                                />
                                            </Grid>
                                        </Grid>
                                        <FormControlLabel style={{ marginTop: 20, marginLeft: 5 }} control={<Switch checked={dateSwitch} onChange={(event) => {
                                            setDateSwitch(event.target.checked)
                                        }} />} />
                                    </div>


                                </div>
                            </Card>
                        )}

                        {
                            showFilter ?
                                (
                                    <Card style={{ height: 20, cursor: 'pointer', padding: 5, paddingTop: 15, paddingBottom: 15 }}
                                        onClick={() => {
                                            setShowFilter(false);
                                        }}
                                    >
                                        <ArrowForwardIos color={'primary'} />
                                    </Card>
                                ) :
                                (
                                    <Card
                                        style={{
                                            height: 20, cursor: 'pointer', padding: 5, paddingTop: 15, paddingBottom: 15,
                                            paddingRight: 5, display: 'flex', alignItems: "center"
                                        }}
                                        onClick={() => {
                                            setShowFilter(true);
                                        }}
                                    >
                                        <ArrowBackIos style={{}} color={'primary'} />
                                        <h4>Filter</h4>
                                    </Card>
                                )
                        }
                    </div>
                </div>

                {currentEventDate && <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        right: 0,
                        backgroundColor: '#C70039',
                        color: 'white',
                        padding: '5px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: dateBadge ? 'e-resize' : 'w-resize',
                        width: !dateBadge ? '10px' : 'auto',
                        height: !dateBadge ? '20px' : 'auto',
                    }}
                    onClick={() => {
                        setDateBadge(!dateBadge)
                    }}
                >
                    {dateBadge && currentEventDate}
                </div>
                }

                <div style={{ height: '300px' }} />
            </div >

        </InfiniteScroll>

    );
};



export default TimelineScreen;
