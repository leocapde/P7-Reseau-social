const Publication = require('../models/Publication');
const User = require('../models/User')
const Commentary = require('../models/Commentary')
const fs = require('fs');

exports.createPublication = (req, res, next) => {
    const text = JSON.parse(req.body.description)
    if (req.file) {
        Publication.create({
            UserId: req.token.userId,
            description: text,
            fileUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
        })
        .then(() => res.status(201).json({ message: 'Nouvel publication créée !' }))
        .catch(error => res.status(400).json({ error }))
    } 
    else if (text) {
        Publication.create({
            UserId: req.token.userId,
            description: text
        })
        .then(() => res.status(201).json({ message: 'Nouvel publication créée !' }))
        .catch(error => res.status(400).json({ error }))
    }
    else {
        return res.status(400).json({ message: 'Publication vide...' })
    }
};

exports.getAllPublications = (req, res, next) => {
    const userAttributes = ['id', 'firstName', 'lastName', 'imageUrl', 'isAdmin']
    Publication.findAll({ 
        order: [
            ['createdAt', 'DESC'],
            [Commentary, 'createdAt', 'ASC']
        ],
        include: [
            { 
                model: User, 
                attributes: userAttributes 
            },
            { 
                model: Commentary, 
                include: { 
                    model: User,
                    attributes: userAttributes
                } 
            }
        ]
    })
    .then(publications => res.status(200).json( publications ))
    .catch(error => res.status(400).json({ error }))
};

exports.getAllUserPublications = (req, res, next) => {
    const userAttributes = ['id', 'firstName', 'lastName', 'imageUrl', 'isAdmin']
    Publication.findAll({ 
        where: { UserId: req.params.id },
        order: [
            ['createdAt', 'DESC'],
            [Commentary, 'createdAt', 'ASC']
        ],
        include: [
            { 
                model: User, 
                attributes: userAttributes 
            },
            { 
                model: Commentary, 
                include: { 
                    model: User,
                    attributes: userAttributes
                } 
            }
        ]
    })
    .then(publications => res.status(200).json( publications ))
    .catch(error => res.status(400).json({ error }))
};

exports.getOnePubblication = (req, res, next) => {
    Publication.findOne({ where: { id: req.params.id }})
    .then(publication => res.status(200).json({ publication }))
    .catch(error => res.status(400).json({ error }))
}

exports.updateOnePublication = (req, res, next) => {
    Publication.findOne({ where: { id: req.params.id }})
    .then(publication => {
        if (publication.dataValues.UserId === req.token.userId || req.token.isAdmin) {
            const text = JSON.parse(req.body.description)
            if (req.file) {
                if (publication.fileUrl) {
                    const oldFilename = publication.fileUrl.split("/images/")[1];
                    console.log(oldFilename)
                    fs.unlink(`images/${oldFilename}`, () => {
                        publication.update({
                            description: text,
                            fileUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
                        })
                        return res.status(200).json({ message: 'Publication modifiée !' });
                    })
                } else {
                    publication.update({
                        description: text,
                        fileUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
                    })
                    console.log(112)
                    return res.status(200).json({ message: 'Publication modifiée !' });
                }
            } else {
                publication.update({ description: text })
                return res.status(200).json({ message: 'Publication modifiée !' });
            }
        }
    })
    .catch(error => {
        console.log('error')
        res.status(500).json({ error })
    })
}

exports.deletePublication = (req, res, next) => {
    Publication.findOne({ where: { id: req.params.id } })
    .then(publication => {
        if (publication.dataValues.UserId === req.token.userId || req.token.isAdmin) {
            if (publication.fileUrl) {
                const filename = publication.fileUrl.split("/images/")[1]
                fs.unlink(`images/${filename}`, () => {
                    publication.destroy();
                    return res.status(200).json({ message: 'Publication supprimée !' });        
                })
            } 
            else {
                publication.destroy();
                return res.status(200).json({ message: 'Publication supprimée !' });
            }
        } else {
            return res.status(403).json({ error: 'Requête non authorisée !'})
        }
    })
    .catch(error => res.status(500).json({ error }))
};
