export default () => {
    self.addEventListener('message', e => { // eslint-disable-line no-restricted-globals
        if (!e) return;
        const array = e.data;

        const sortedData = quicksort(array);
        postMessage(sortedData);
    })

    const quicksort = (arr) => {
        if (arr.length <= 1) {
            return arr;
        }

        const pivot = arr[0];
        const left = [];
        const right = [];

        for (let i = 1; i < arr.length; i++) {
            if ((String(arr[i]?.name)?.trim() || '')?.toLowerCase()?.localeCompare(String(pivot?.name)?.trim()?.toLowerCase() || '') < 0) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }

        return [...quicksort(left), pivot, ...quicksort(right)];
    };
}