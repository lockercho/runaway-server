-- phpMyAdmin SQL Dump
-- version 4.1.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 22, 2015 at 04:34 PM
-- Server version: 5.5.33
-- PHP Version: 5.5.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `runaway`
--

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_time` int(11) NOT NULL,
  `game_time` int(11) NOT NULL,
  `status` enum('idle','playing','end','') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `game`
--

INSERT INTO `game` (`id`, `start_time`, `game_time`, `status`) VALUES
(1, 0, 20, 'playing');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `team` int(11) NOT NULL,
  `user_order` int(11) NOT NULL,
  `number` int(11) NOT NULL,
  `status` enum('idle','play','dead','rip') NOT NULL,
  `client_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=145 ;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `game_id`, `team`, `user_order`, `number`, `status`, `client_id`) VALUES
(97, 1, 0, 1, 76798, 'idle', ''),
(98, 1, 0, 2, 78086, 'idle', ''),
(99, 1, 0, 3, 29889, 'idle', ''),
(100, 1, 0, 4, 36025, 'idle', ''),
(101, 1, 0, 5, 2807, 'idle', ''),
(102, 1, 0, 6, 9079, 'idle', ''),
(103, 1, 0, 7, 3390, 'idle', ''),
(104, 1, 0, 8, 59606, 'idle', ''),
(105, 1, 0, 9, 50854, 'idle', ''),
(106, 1, 0, 10, 88930, 'idle', ''),
(107, 1, 0, 11, 52477, 'idle', ''),
(108, 1, 0, 12, 8207, 'idle', ''),
(109, 1, 1, 1, 61543, 'idle', ''),
(110, 1, 1, 2, 69798, 'idle', ''),
(111, 1, 1, 3, 28374, 'idle', ''),
(112, 1, 1, 4, 18626, 'idle', ''),
(113, 1, 1, 5, 49687, 'idle', ''),
(114, 1, 1, 6, 14306, 'idle', ''),
(115, 1, 1, 7, 55456, 'idle', ''),
(116, 1, 1, 8, 6843, 'idle', ''),
(117, 1, 1, 9, 63403, 'idle', ''),
(118, 1, 1, 10, 58047, 'idle', ''),
(119, 1, 1, 11, 78763, 'idle', ''),
(120, 1, 1, 12, 97472, 'idle', ''),
(121, 1, 2, 1, 83117, 'idle', ''),
(122, 1, 2, 2, 35999, 'idle', ''),
(123, 1, 2, 3, 22732, 'idle', ''),
(124, 1, 2, 4, 46048, 'idle', ''),
(125, 1, 2, 5, 95049, 'idle', ''),
(126, 1, 2, 6, 38590, 'idle', ''),
(127, 1, 2, 7, 77319, 'idle', ''),
(128, 1, 2, 8, 71074, 'idle', ''),
(129, 1, 2, 9, 63362, 'idle', ''),
(130, 1, 2, 10, 81310, 'idle', ''),
(131, 1, 2, 11, 20712, 'idle', ''),
(132, 1, 2, 12, 49374, 'idle', ''),
(133, 1, 3, 1, 71116, 'idle', ''),
(134, 1, 3, 2, 22331, 'idle', ''),
(135, 1, 3, 3, 57628, 'idle', ''),
(136, 1, 3, 4, 27539, 'idle', ''),
(137, 1, 3, 5, 21741, 'idle', ''),
(138, 1, 3, 6, 27108, 'idle', ''),
(139, 1, 3, 7, 25576, 'idle', ''),
(140, 1, 3, 8, 33161, 'idle', ''),
(141, 1, 3, 9, 87279, 'idle', ''),
(142, 1, 3, 10, 95155, 'idle', ''),
(143, 1, 3, 11, 46084, 'idle', ''),
(144, 1, 3, 12, 77449, 'idle', '');
