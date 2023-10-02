const Error = ({ statusCode }) => {
    return (
        <p>
            {statusCode
                ? `Une erreur ${statusCode} est survenue sur le serveur`
                : "Une erreur s'est produite sur le client"}
        </p>
    )
}

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
}

export default Error;
