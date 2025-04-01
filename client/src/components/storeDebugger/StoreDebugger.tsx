import { useAppSelector } from '../../store/hooks.ts';

const StoreDebugger = () => {
    // Явно выбираем только нужные части состояния
    const authState = useAppSelector(state => state.auth);

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            background: 'white',
            padding: '10px',
            border: '1px solid #ccc',
            zIndex: 9999,
            maxWidth: '300px',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px'
        }}>
            <h4>Current Auth State:</h4>
            <pre>{JSON.stringify({
                user: authState.user,
            }, null, 2)}</pre>
        </div>
    );
};

export default StoreDebugger;