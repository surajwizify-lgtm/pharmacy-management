import { createSlice } from '@reduxjs/toolkit'

interface UIState {
    collapsed: boolean;
}

const initialState: UIState = {
    collapsed: false
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSideBar: (state) => {
            state.collapsed = !state.collapsed;
        },
        setCollapsed: (state, action) => {
            state.collapsed = action.payload
        }
    }
})

export const { toggleSideBar, setCollapsed } = uiSlice.actions;
export default uiSlice.reducer;