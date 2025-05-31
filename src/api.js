export const fetchData = async (endpoint, setState, timestampKey, prefix, setTimestamps) => {
  try {
    const apiUrl = process.env.PUBLIC_API_URL || 'http://localhost:5000';
    const url = `${apiUrl}${endpoint}`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    setState(data);

    setTimestamps((prev) => ({
      ...prev,
      [timestampKey]: new Date().toLocaleString(),
    }));
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
  }
};
