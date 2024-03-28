import styles from './TimelineCollection.module.css';
import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';
import { useLoader } from '../LoaderContext';
import { showError, showDeleteConfirmation } from '../utilities/helping_functions';
import { getAuthToken } from '../utilities/authentication';
import axios from 'axios';
import { Delete, Edit, Analytics } from '@mui/icons-material';

function TimelineCollection() {
    const [timeline, setTimeline] = useState([]);
    const [open, setOpen] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleEditOpen = () => setOpenEdit(true);
    const handleEditClose = () => setOpenEdit(false);
    const navigate = useNavigate();
    const [newTimelineName, setNewTimelineName] = useState('');
    const { isLoading, showLoader, hideLoader } = useLoader();
    const [timelineToEdit, setTimelineToEdit] = useState({
        index: undefined,
        name: undefined
    });

    useEffect(() => {
        (async () => {
            try {
                showLoader();
                const response = await axios.get(process.env.REACT_APP_SERVER_URL + '/timeline', {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json',
                    },
                });

                setTimeline(response.data.timelines);
            } catch (error) {
                showError('Error Occured', error.message);
            }
            finally {
                hideLoader();
            }
        })()
    }, [])

    return (
        <div className={styles.timeline_main}>
            <h1>Timeline Collection</h1>
            <Button color="primary" variant="contained" onClick={handleOpen}>
                Create new Timeline
            </Button>
            <div className={styles.timeline_screen}>
                {
                    timeline.map((item, index) => {
                        return (
                            <Button color="primary" key={item._id} onClick={() => {
                                navigate("/timeline/" + item._id + '/' + item.name);
                            }}>
                                <div className={styles.timeline_box}>
                                    <div className={styles.timeline_box_header}>{item.name}</div>
                                    <div className={styles.timeline_box_content}>
                                        {item.totalEvents}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' }}>
                                        <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate("/analytics/" + item._id + '/' + item.name);
                                            }} >
                                            <Analytics style={{ color: 'darkorange' }} />
                                        </div>

                                        <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditOpen();
                                                setTimelineToEdit({
                                                    index,
                                                    name: item.name
                                                })
                                            }} >
                                            <Edit color={"secondary"} />
                                        </div>
                                        <div style={{ marginTop: 17, marginLeft: 10, height: 20, cursor: 'pointer', }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showDeleteConfirmation('Delete timeline', 'Do you want to delete timeline?', async () => {
                                                    try {
                                                        showLoader();
                                                        await axios.delete(process.env.REACT_APP_SERVER_URL + '/timeline', {
                                                            headers: {
                                                                Authorization: `Bearer ${getAuthToken()}`,
                                                                'Content-Type': 'application/json',
                                                            },
                                                            data: {
                                                                _id: item._id,
                                                            }
                                                        });

                                                        timeline.splice(index, 1);
                                                        setTimeline(timeline);
                                                    }
                                                    catch (error) {
                                                        showError('Error Occured', error.message);
                                                    }
                                                    finally {
                                                        hideLoader();
                                                    }
                                                });
                                            }} >
                                            <Delete style={{ color: '#C8102E' }} />
                                        </div>
                                    </div>
                                </div>

                            </Button>
                        )
                    })
                }
                {timeline.length === 0 && isLoading === false && (
                    <div style={{ marginTop: 150, fontSize: 24, fontWeight: 'thin' }}>Nothing to show</div>
                )}
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <div className={styles.timeline_modal_container}>
                        <h2 id="create-timeline-modal">Create Timeline</h2>
                        <TextField
                            label="Enter timeline name"
                            value={newTimelineName}
                            onChange={(e) => {
                                setNewTimelineName(e.target.value)
                            }}
                            id="standard-basic" variant="standard"
                            style={{ width: '350px', marginBottom: 40 }}
                        />
                        <Button type="submit" variant="contained" color="primary"
                            onClick={async () => {
                                if (newTimelineName) {
                                    try {
                                        showLoader();
                                        const response = await axios.post(process.env.REACT_APP_SERVER_URL + '/timeline', {
                                            name: newTimelineName,
                                        }, {
                                            headers: {
                                                Authorization: `Bearer ${getAuthToken()}`,
                                                'Content-Type': 'application/json',
                                            },
                                        });
                                        setTimeline([
                                            {
                                                _id: response.data._id,
                                                name: newTimelineName,
                                                totalEvents: 0,
                                            },
                                            ...timeline,
                                        ])
                                        handleClose();
                                        navigate("/timeline/" + response.data._id + '/' + newTimelineName);
                                    }
                                    catch (error) {
                                        handleClose();
                                        showError('Error Occured', error.message);
                                    }
                                    finally {
                                        hideLoader();
                                    }
                                }
                                else {
                                    alert('Please enter timeline name')
                                }
                            }}
                        >
                            Create
                        </Button>
                    </div>
                </Modal>

                <Modal
                    open={openEdit}
                    onClose={handleEditClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <div className={styles.timeline_modal_container}>
                        <h2 id="create-timeline-modal">Edit Timeline</h2>
                        <TextField
                            label="Enter timeline name"
                            value={timelineToEdit.name}
                            onChange={(e) => {
                                setTimelineToEdit({
                                    ...timelineToEdit,
                                    name: e.target.value
                                })
                            }}
                            id="standard-basic" variant="standard"
                            style={{ width: '350px', marginBottom: 40 }}
                        />
                        <Button type="submit" variant="contained" color="primary"
                            onClick={async () => {
                                if (timelineToEdit.name) {
                                    try {
                                        showLoader();
                                        await axios.put(process.env.REACT_APP_SERVER_URL + '/timeline', {
                                            _id: timeline[timelineToEdit.index]._id,
                                            name: timelineToEdit.name,
                                        }, {
                                            headers: {
                                                Authorization: `Bearer ${getAuthToken()}`,
                                                'Content-Type': 'application/json',
                                            },
                                        });
                                        timeline[timelineToEdit.index].name = timelineToEdit.name;
                                        setTimeline(timeline)
                                        handleEditClose();
                                    }
                                    catch (error) {
                                        handleEditClose();
                                        showError('Error Occured', error.message);
                                    }
                                    finally {
                                        hideLoader();
                                    }
                                }
                                else {
                                    alert('Please enter timeline name')
                                }
                            }}
                        >
                            Edit
                        </Button>
                    </div>
                </Modal>

            </div>
        </div>
    );
};




export default TimelineCollection;
