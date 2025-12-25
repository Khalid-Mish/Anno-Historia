import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

export function isValidEmail(email) {
    // Regular expression to validate email addresses 
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}

export function showError(title, message) {
    confirmAlert({
        title,
        message,
        buttons: [
            {
                label: 'OK'
            }
        ]
    });
}

export function showInfo(title, message) {
    confirmAlert({
        title,
        message,
        buttons: [
            {
                label: 'OK'
            }
        ]
    });
}


export function showDeleteConfirmation(title, message, deleteEventCallBack) {
    confirmAlert({
        title,
        message,
        buttons: [
            {
                label: 'No'
            },
            {
                label: 'Yes',
                onClick: deleteEventCallBack
            }
        ]
    });
}

export function binarySearch(array, target) {
    let left = 0;
    let right = array.length - 1;
    let iterations = 0;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        // Check if the middle element is the target
        if ((String(array[mid]?.name)?.trim() || '')?.toLowerCase()?.localeCompare((String(target).trim() || '').toLowerCase()) === 0) {
            iterations++;
            return { index: mid, iterations };
        }

        // If the target is in the left half
        if ((String(array[mid]?.name)?.trim() || '')?.toLowerCase()?.localeCompare((String(target).trim() || '').toLowerCase()) > 0) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }

        iterations++;
    }

    // If the target is not found
    return { index: -1, iterations };
};